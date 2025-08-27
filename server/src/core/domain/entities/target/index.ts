import { NftTarget } from "./nft/nft.target";
import { TokenTarget } from "./token/token.target";

export { TargetType } from "./base/types";
export { NftTarget } from "./nft/nft.target";
export { TokenTarget } from "./token/token.target";

export type Target = TokenTarget | NftTarget;
