
# DEDO Merchant API

API to create payment orders, for the **DEDO** ERC20 (evm blockchain).

### Flow

1. API to create an order
  - We have a master seed/mnemonics-based hot wallet.
  - We generate a deposit address using multiple derivation child IDs.
  - We store the order reference, address, amount, and child ID in the database.
2. (The deposit address is returned by the API and displayed to the user.)
3. The user sends the payment.
  - Need the system to handle underpaid or overpaid payments. This will require a manual or automatic refund to the sender's address. (Disclaimer: Do not pay using exchange withdrawal.)
4. Create an API to show the order status: **waiting**, **successful** or **expired**. (Use the order ID.). Other status: **overpaid**, **underpaid**, **cleared**.
5. Create a cron service that will check the on-chain balance for waiting orders and update the status.
6. Create a service to forward DEDO to cold-wallet: Received and confirmed DEDO are automatically forwarded to the cold wallet. (This means that funds will only be held temporarily on the server hot wallet.)

Amounts are always represented in the smallest DEDO unit: `1000000000000000000 adedo = 1 DEDO`.

### Requirements

- MongoDB running on `mongodb://localhost:27017`
- Sepolia (testnet) RPC server, by default using `https://ethereum-sepolia-rpc.publicnode.com`
- The Web Server runs on the provided env PORT or `8080` by default

### Config

Check the *config.js* file. By default the Cron Job interval is 60 seconds.

### Start

1. Install dependencies `yarn install`
2. Make sure the Mongo DB is running (see docker command section below)
3. Run `yarn start`

### Server API

Create an order:

```
POST - /order/create

Expected payload:

{
  amount: '1000000000000000000', // 1 DEDO order amount as string in adedo (smallest unit!)
  customer: '123456', // a customer identifier (string)
  item: 'xxxx', // an item identifier
  note: '...', // additional notes
}

JSON Result:

{ status: 'waiting', orderId: childId, address, amount, time }
OR
{ status: 'error', error: 'error msg...' }

```

Get order status:

```
GET - /order/get/<order-id>

JSON Result:

{
  childId,
  address,
  amount,
  received,
  customer,
  time,
  status,
  item,
  note,
}
```

## MongoDB database

Running a MongoDB container:

`docker run -d -p 127.0.0.1:27017:27017 --name mongodb -v $HOME/mongo_merchant_db_data:/data/db mongo:latest`

Data will be persistent, stored in the server `/home/<user>/mongo_merchant_db_data` directory. The MongoDB server will have no auth, but bind to 127.0.0.1 so it won't be accessible from a remote client.

If for any reason the DB must be accessed remotely (for example by a MongoDB client), you can install and use the `socat` tool: `socat TCP-LISTEN:27017,fork,bind=104.131.162.155 TCP:localhost:27017` that will redirect public iface traffic on port 27017 to localhost:27017 (MongoDB running).

You can make sure the container is running executing `docker ps`. Or check the container logs with `docker logs -f <container_id>`

