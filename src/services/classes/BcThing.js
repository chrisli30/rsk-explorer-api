import { isAddress, serialize, isBlockHash } from '../../lib/utils'
import NativeContracts from '../../lib/NativeContracts'

export class BcThing {
  constructor ({ nod3, initConfig, collections } = {}) {
    if (!initConfig) throw new Error('missing init config')
    this.initConfig = initConfig
    this.nod3 = nod3
    this.collections = collections
    this.nativeContracts = NativeContracts(initConfig)
    this.data = {}
  }
  getData (serialize = false) {
    return (serialize) ? this.serialize(this.data) : this.data
  }
  serialize (obj) {
    return serialize(obj)
  }
  isAddress (address) {
    return isAddress(address)
  }
  fetch () {
    return _methodNotImplemented('fetch')
  }
  save () {
    return _methodNotImplemented('save')
  }
  isBlockHash (hashOrNumber) {
    return isBlockHash(hashOrNumber)
  }
}

export const _methodNotImplemented = (method) => {
  throw new Error(`Method ${method} is not implemented`)
}

export default BcThing
