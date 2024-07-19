export type ZOrderUpdate = {
    user_id: string
    unfilled_quantity: number
    app_id: number
    checksum: string
    placed_by: string
    order_id: string
    exchange_order_id: string | null
    parent_order_id: string | null
    status: string | null
    status_message: string | null
    status_message_raw: string | null
    order_timestamp: Date
    exchange_update_timestamp: string
    exchange_timestamp: Date
    variety: string
    exchange: string
    tradingsymbol: string
    instrument_token: number
    order_type: string
    transaction_type: string
    validity: string
    product: string
    quantity: number
    disclosed_quantity: number
    price: number
    trigger_price: number
    average_price: number
    filled_quantity: number
    pending_quantity: number
    cancelled_quantity: number
    market_protection: number
    meta: string | Object
    tag: string | null
    guid: string
  }
  
  export interface ZTick {
    instrument_token: number
    last_price: number
  }