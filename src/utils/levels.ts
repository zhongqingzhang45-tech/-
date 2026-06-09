// L1-L8状态机配置
export const STATUS_LEVELS = [
  {
    level: 1,
    label: 'L1 围观',
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/20',
    dot: 'bg-gray-500',
    description: '新添加好友，未互动',
  },
  {
    level: 2,
    label: 'L2 有兴趣',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    dot: 'bg-blue-500',
    description: '查看过内容，有初步兴趣',
  },
  {
    level: 3,
    label: 'L3 咨询',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    dot: 'bg-cyan-500',
    description: '主动咨询产品详情',
  },
  {
    level: 4,
    label: 'L4 询价',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    dot: 'bg-yellow-500',
    description: '询问价格、优惠',
  },
  {
    level: 5,
    label: 'L5 犹豫',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    dot: 'bg-orange-500',
    description: '需要更多信息，未做决定',
  },
  {
    level: 6,
    label: 'L6 准备付款',
    color: 'text-primary-400',
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/20',
    dot: 'bg-primary-500',
    description: '确认购买，等待付款链接',
  },
  {
    level: 7,
    label: 'L7 已付款',
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/20',
    dot: 'bg-success',
    description: '已完成付款，进入交付',
  },
  {
    level: 8,
    label: 'L8 转介绍',
    color: 'text-accent-400',
    bg: 'bg-accent-500/10',
    border: 'border-accent-500/20',
    dot: 'bg-accent-500',
    description: '已转介绍新客户',
  },
];

export function getLevelConfig(level: number) {
  return STATUS_LEVELS.find((l) => l.level === level) || STATUS_LEVELS[0];
}
