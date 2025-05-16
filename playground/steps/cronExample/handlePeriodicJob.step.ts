import { CronHandler } from 'motia'

export const config = {
  type: 'event',
  name: 'HandlePeriodicJob',
  description: 'Handles the periodic job event',
  subscribes: ['cron-ticked'],
  emits: [],
  flows: ['cron-example'],
}

export const handler: CronHandler = async ({ logger }) => {
  logger.info('Periodic job executed')
}
