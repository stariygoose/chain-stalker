import { NftTarget } from "./nft.target";
import { TokenTarget } from "./token.target";

export { TargetType } from "./base/types";
export { NftTarget } from "./nft.target";
export { TokenTarget } from "./token.target";

export type Target = TokenTarget | NftTarget;
