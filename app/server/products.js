import { AttributeValue, CreateTableCommand,DynamoDBClient, KeyType } from '@aws-sdk/client-dynamodb';


const client = new DynamoDBClient({
  region: "us-west-2",
  endpoint: "http://localhost:8000"
});

 const table = async () => {
  const params = {
    TableName: 'ShopifyProducts',
    KeySchema: [
      { AttributeName : 'myShopifyDomain', KeyType: 'HASH'},
      { AttributeName: 'offerId', KeyType: 'SORT' }  
    ],
    AttributeDefinitions: [
      { AttributeName: 'myShopifyDomain', AttributeType: 'S' },
      { AttributeName:'offerId', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  try {
    // console.log(client);
    console.log("try block");
    const createTableCommand = new CreateTableCommand(params);
    await client.send(createTableCommand);
    console.log('Table created successfully.');
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
};


table();