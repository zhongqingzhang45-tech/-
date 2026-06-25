export enum RESOURCE_TYPE {
  BACKGROUND = "background",
  CHARACTER = "character",
  ICON = "icon"
}

export interface ResourceModel {
  resource_id: string;
  name: string;
  type: RESOURCE_TYPE;
  link: string;
}
