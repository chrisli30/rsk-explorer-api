import { DataCollector, DataCollectorItem } from './dataCollector'
import config from './config'
const perPage = config.api.perPage
const lastLimit = config.api.lastBlocks || 50

const c = config.blocks
const blocksCollection = c.blocksCollection
const txCollection = c.txCollection
const accountCollection = c.accountsCollection

class Blocks extends DataCollector {
  constructor(db) {
    let collectionName = blocksCollection
    super(db, { perPage, collectionName })
    this.lastLimit = lastLimit
    this.latest = 0
    this.lastBlocks = []
    this.lastTransactions = []

    this.addItem(blocksCollection, 'Block', Block, true)
    this.addItem(txCollection, 'Tx', Tx, true)
    this.addItem(accountCollection, 'Account', Account, true)
  }
  tick () {
    this.setLastBlocks()
  }

  run (action, params) {
    return this.itemPublicAction(action, params, '*')
  }
  setLastBlocks () {
    this.collection
      .find()
      .sort({ number: -1 })
      .limit(this.lastLimit)
      .toArray((err, blocks) => {
        if (err) console.log(err)
        else {
          this.Tx.db
            .find()
            .sort({ blockNumber: -1, transactionIndex: -1 })
            .limit(this.lastLimit)
            .toArray((err, txs) => {
              if (err) console.log(err)
              else {
                this.updateLastBlocks(blocks, txs)
              }
            })
        }
      })
  }

  getLastBlocks () {
    let blocks = this.lastBlocks
    let transactions = this.lastTransactions
    return this.formatData({ blocks, transactions })
  }

  updateLastBlocks (blocks, transactions) {
    this.lastBlocks = blocks
    this.lastTransactions = transactions
    let latest
    if (blocks && blocks[0]) latest = blocks[0].number
    if (latest !== this.latest) {
      this.latest = latest
      this.events.emit('newBlocks', this.formatData({ blocks, transactions }))
    }
    //this.events.emit('newBlocks', blocks)
  }
}

class Block extends DataCollectorItem {
  constructor(collection, key, parent) {
    super(collection, key, parent)
    this.publicActions = {
      getBlock: params => {
        let number = parseInt(params.number)
        if (number)
          return this.getPrevNext(
            params,
            { number: number },
            { number: { $lte: number - 1 } },
            { number: { $lte: number + 1 } },
            { number: -1 }
          ).then(block => {
            if (block && block.DATA) {
              return this.parent
                .itemPublicAction('getBlockTransactions', {
                  blockNumber: block.DATA.number,
                  key: 'Tx'
                })
                .then(txs => {
                  block.DATA.transactions = txs.DATA
                  return block
                })
            }
          })
      },
      getBlocks: params => {
        return this.getPageData({}, params, { number: -1 })
      }
    }
  }
}

class Tx extends DataCollectorItem {
  constructor(collection, key, parent) {
    super(collection, key, parent)
    this.publicActions = {
      getTransactions: params => {
        let query = {}
        let txType = (params.query) ? params.query.txType : null
        if (txType) {
          query = this.fieldFilterParse('txType', txType)
        }
        return this.getPageData(query, params, { blockNumber: -1, transactionIndex: -1 })
      },
      getTransaction2: params => {
        let hash = params.hash
        return this.getPrevNext(
          params,
          { hash: hash },
          {},
          {},
          { blockNumber: 1, transactionIndex: 1 }
        )
      },
      getTransaction: params => {
        let hash = params.hash
        let query = { hash }
        return this.db.findOne(query).then(tx => {
          if (!tx) return

          return this.getPrevNext(
            params,
            query,
            {
              $or: [
                { transactionIndex: { $gt: tx.transactionIndex } },
                { blockNumber: { $gte: tx.blockNumber } }
              ]
            },
            {
              $and: [
                { transactionIndex: { $lt: tx.transactionIndex } },
                { blockNumber: { $lte: tx.blockNumber } }
              ]
            },
            { blockNumber: -1, transactionIndex: -1 }
          ).then(res => {
            //FIX IT
            res.NEXT = null
            res.PREV = null
            return res
          })
        })
      },
      getBlockTransactions: params => {
        let blockNumber = params.blockNumber
        if (blockNumber) {
          return this.find({ blockNumber })
        }
      },
      getAccountTransactions: params => {
        let address = params.address
        let Account = this.parent.Account
        return Account.getOne({ address }).then((account) => {
          return this.getPageData(
            {
              $or: [{ from: address }, { to: address }]
            },
            params,
            { timestamp: -1 }
          ).then(res => {
            account.DATA.account = address
            res.PARENT_DATA = account.DATA
            return res
          })
        })

      }
    }
  }
}
class Account extends DataCollectorItem {
  constructor(collection, key, parent) {
    super(collection, key, parent)
    this.publicActions = {
      getAccount: params => { },
      getAccounts: params => {
        return this.getPageData({}, params, { _id: -1 })
      }
    }
  }
}
export default Blocks