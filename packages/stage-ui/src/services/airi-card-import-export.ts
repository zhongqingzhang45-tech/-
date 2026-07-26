import type { AiriCard } from '../stores/modules/airi-card'
import type { DisplayModel, DisplayModelFormat } from '../stores/display-models'

import { exportToJSON } from '@proj-airi/ccc'
import JSZip from 'jszip'

/**
 * Card package error codes surfaced to the UI via i18n keys.
 *
 * - `missing-file`: the archive does not contain a `card.json` entry.
 * - `invalid-file`: the archive exists but `card.json` could not be parsed
 *   into a valid AIRI card.
 */
export type AiriCardPackageErrorCode = 'missing-file' | 'invalid-file'

/**
 * Error thrown when an AIRI card package cannot be imported.
 *
 * The `code` field lets the import UI pick a precise localized message
 * instead of relying on the free-form error text.
 */
export class AiriCardPackageError extends Error {
  readonly code: AiriCardPackageErrorCode

  constructor(code: AiriCardPackageErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'AiriCardPackageError'
    this.code = code
  }
}

const CARD_JSON_ENTRY = 'card.json'
const ASSETS_DIR = 'assets'

interface DisplayModelsStoreShape {
  addDisplayModel: (format: DisplayModelFormat, file: File) => Promise<DisplayModel>
  getDisplayModel: (id: string) => Promise<DisplayModel | undefined>
}

interface ImportAiriCardPackageParams {
  file: File
  displayModelsStore: DisplayModelsStoreShape
}

interface ExportAiriCardPackageParams {
  card: AiriCard
  displayModelsStore: DisplayModelsStoreShape
}

/**
 * Detects the display-model format from a zipped asset path.
 *
 * Live2D, VRM, Spine, and MMD archives are distinguished by extension so
 * the imported file is registered with the right preview generator.
 */
function detectDisplayModelFormat(fileName: string): DisplayModelFormat | undefined {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.vrm'))
    return 'vrm' as DisplayModelFormat
  if (lower.endsWith('.zip')) {
    if (lower.includes('live2d'))
      return 'live2d-zip' as DisplayModelFormat
    if (lower.includes('spine'))
      return 'spine-zip' as DisplayModelFormat
    if (lower.includes('pmx') || lower.includes('pmd'))
      return 'pmx-zip' as DisplayModelFormat
  }
  return undefined
}

/**
 * Imports an AIRI card package from a `.zip` archive.
 *
 * The archive must contain a `card.json` entry holding the AIRI card
 * payload (CC v3 + AIRI extensions). Optional model assets under
 * `assets/` are registered with the display-models store so the card
 * can render its avatar after import.
 *
 * Use when:
 * - The user drops a previously exported `.zip` card package.
 *
 * Returns:
 * - The reconstructed {@link AiriCard}, with `extensions.airi.modules.displayModelId`
 *   pointing at the freshly imported display model when one was bundled.
 */
export async function importAiriCardPackage({ file, displayModelsStore }: ImportAiriCardPackageParams): Promise<AiriCard> {
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(file)
  }
  catch (error) {
    throw new AiriCardPackageError('invalid-file', `Failed to read card package: ${(error as Error).message}`)
  }

  const cardEntry = zip.file(CARD_JSON_ENTRY)
  if (!cardEntry)
    throw new AiriCardPackageError('missing-file', `Card package is missing ${CARD_JSON_ENTRY}`)

  let cardJson: string
  try {
    cardJson = await cardEntry.async('string')
  }
  catch (error) {
    throw new AiriCardPackageError('invalid-file', `Failed to read ${CARD_JSON_ENTRY}: ${(error as Error).message}`)
  }

  let card: AiriCard
  try {
    card = JSON.parse(cardJson) as AiriCard
  }
  catch (error) {
    throw new AiriCardPackageError('invalid-file', `Failed to parse ${CARD_JSON_ENTRY}: ${(error as Error).message}`)
  }

  if (!card || typeof card !== 'object' || !card.extensions?.airi) {
    throw new AiriCardPackageError('invalid-file', 'Card payload is missing the AIRI extension block')
  }

  // Register any bundled display-model assets so the card can render.
  const assetEntries = zip.folder(ASSETS_DIR)?.file(/.*/i) ?? []
  for (const entry of assetEntries) {
    const format = detectDisplayModelFormat(entry.name)
    if (!format)
      continue

    try {
      const bits = await entry.async('uint8array')
      const assetFile = new File([bits], entry.name.split('/').pop() ?? entry.name, { type: 'application/octet-stream' })
      const imported = await displayModelsStore.addDisplayModel(format, assetFile)
      if (!card.extensions.airi.modules.displayModelId) {
        card.extensions.airi.modules.displayModelId = imported.id
      }
    }
    catch (error) {
      console.warn(`[airi-card-import-export] skipping asset ${entry.name}:`, error)
    }
  }

  return card
}

/**
 * Exports an AIRI card to a `.zip` package.
 *
 * The archive contains:
 * - `card.json` — the full AIRI card payload (CC v3 + AIRI extensions).
 * - `assets/` — when the card references a file-backed display model,
 *   the model binary is bundled so the recipient can re-import it.
 *
 * Use when:
 * - The user clicks "export" on a card and expects a shareable archive.
 *
 * Returns:
 * - A `Blob` of type `application/zip` ready to download.
 */
export async function exportAiriCardPackage({ card, displayModelsStore }: ExportAiriCardPackageParams): Promise<Blob> {
  const zip = new JSZip()
  zip.file(CARD_JSON_ENTRY, JSON.stringify(card, null, 2))

  const displayModelId = card.extensions?.airi?.modules?.displayModelId
  if (displayModelId) {
    try {
      const displayModel = await displayModelsStore.getDisplayModel(displayModelId)
      if (displayModel?.type === 'file') {
        const file = displayModel.file
        const fileName = file.name || `${displayModel.id}.${displayModel.format}`
        zip.file(`${ASSETS_DIR}/${fileName}`, file)
      }
    }
    catch (error) {
      console.warn('[airi-card-import-export] failed to attach display model asset:', error)
    }
  }

  // Include a CC v3 manifest alongside the AIRI payload so generic CC v3
  // tooling can still read the card even without the AIRI extension.
  zip.file('ccv3.json', JSON.stringify(exportToJSON(card), null, 2))

  return zip.generateAsync({ type: 'blob', mimeType: 'application/zip' })
}
