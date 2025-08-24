import { Types } from "mongoose";

export type TargetTypeDbDto = "nft" | "token";
export type StrategyTypeDbDto = "percentage" | "absolute";

interface ITargetDbDto {
  readonly type: TargetTypeDbDto;
}
interface IStrategyTypeDbDto {
  readonly type: StrategyTypeDbDto;
}

interface NftTargetDbDto extends ITargetDbDto {
  readonly type: "nft";
  readonly slug: string;
  readonly name: string;
  readonly chain: string;
  readonly lastNotifiedPrice: number;
  readonly symbol: string;
}

interface TokenTargetDbDto extends ITargetDbDto {
  readonly type: "token";
  readonly lastNotifiedPrice: number;
  readonly symbol: string;
}

interface PercentageStrategyDbDto extends IStrategyTypeDbDto {
  readonly type: "percentage";
  readonly threshold: number;
}

interface AbsoluteStrategyDbDto extends IStrategyTypeDbDto {
  readonly type: "absolute";
  readonly threshold: number;
}

export type TargetDbDto = NftTargetDbDto | TokenTargetDbDto;
export type StrategyDbDto = PercentageStrategyDbDto | AbsoluteStrategyDbDto;

export interface ISubscriptionDbDto {
  readonly _id: Types.ObjectId | null;
  readonly userId: number;
  readonly target: TargetDbDto;
  readonly strategy: StrategyDbDto;
  readonly isActive: boolean;
  readonly lastTriggeredAt: Date;
  readonly createdAt: Date;
}

export interface INftSubscriptionDbDto extends ISubscriptionDbDto {
  readonly target: NftTargetDbDto;
}

export interface ITokenSubscriptionDbDto extends ISubscriptionDbDto {
  readonly target: TokenTargetDbDto;
}

export type SubscriptionDbDto = INftSubscriptionDbDto | ITokenSubscriptionDbDto;
