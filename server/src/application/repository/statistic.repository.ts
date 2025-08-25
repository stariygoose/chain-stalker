export interface IStatisticRepository {
  getStatistic(userId: number): Promise<void>;
}
