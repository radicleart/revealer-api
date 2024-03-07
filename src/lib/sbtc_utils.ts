import { getPegWalletAddressFromPublicKey } from "sbtc-bridge-lib/dist/wallet_utils.js";
import { SbtcWalletController } from "../routes/sbtc/SbtcWalletController.js";
import { getConfig } from "./config.js";

export async function getCurrentSbtcPublicKey():Promise<string> {
    const controller = new SbtcWalletController();
    const cachedUIObject = await (controller.initUi())
    const sbtcWalletPublicKey = cachedUIObject.sbtcContractData.sbtcWalletPublicKey
    return sbtcWalletPublicKey
}

export async function getCurrentSbtcWalletAddress():Promise<string> {
    const pk = await getCurrentSbtcPublicKey()
    return getPegWalletAddressFromPublicKey(getConfig().network, pk)
}
