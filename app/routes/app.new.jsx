import React, { useState, useEffect } from 'react';
import {
  IndexTable,
  LegacyCard,
  useIndexResourceState,
  Text,
  Button,
  Page,
  Link,
} from '@shopify/polaris';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { DeleteIcon, EditIcon } from '@shopify/polaris-icons';
import { fetchProducts } from '../server/getItems';

// Convert DynamoDB format to plain JS objects
const convertDynamoDBData = (data) => {
  console.log("data before conversion", data)
  return data.map(item => ({
    offerId: item.offerId.S,
    title: item.title.S,
    priority: Number(item.priority.N),
    isEnabled: item.isEnabled.S === 'true',
    recommendedProductIds: item.recommendedProductIds.L.map(id => id.S),
    triggerProductIds: item.triggerProductIds.L.map(id => id.S),
  }));

  // return data;
};

// Loader function to fetch initial data
export async function loader() {
  try {
    const response = await fetchProducts();
    return { products: response.data };
  } catch (err) {
    console.log(err);
    return err;
  }
}

// Table component with data management
const MyIndexTable = ({ data, setData }) => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const resourceName = {
    singular: 'product',
    plural: 'products',
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(data);

  const handleEdit = (offerId) => {
    navigate(`../recommendation/${offerId}`);
  };

  const handleDeleteSelected = async () => {
    setIsDeleting(true);
    try {
      await Promise.all(
        selectedResources.map((offerId) =>
          fetch(`http://localhost:3004/recommendation?offerId=${offerId}`, {
            method: 'DELETE',
          })
        )
      );
      await refreshData();
      handleSelectionChange([]);
    } catch (err) {
      console.log(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const refreshData = async () => {
    try {
      const response = await fetch("http://localhost:3004/offers");
      const rawOffers = await response.json();
      console.log("raw offers", rawOffers);
      const offers = convertDynamoDBData(rawOffers);
      setData(offers);
    } catch (err) {
      console.log(err);
    }
  };
  const rowMarkup = data.map(
    ({ offerId, title, priority, isEnabled }, index) => (
      <IndexTable.Row
        id={offerId}
        key={offerId}
        selected={selectedResources.includes(offerId)}
        position={index}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {title}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{priority}</IndexTable.Cell>
        <IndexTable.Cell>
          {isEnabled ? 'Active' : 'Inactive'}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              url={`../recommendation/${offerId}`}
              onClick={(event) => {
                event.stopPropagation(); 
                console.log("Edited ", offerId);
              }}
            >
              <Button icon={EditIcon} />
            </Link>
            <Button icon={DeleteIcon} onClick={() => handleDeleteSelected()} destructive  />
          </div>
        </IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  return (
    <LegacyCard>
    <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
      <IndexTable
        resourceName={resourceName}
        itemCount={data.length}
        selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
        onSelectionChange={handleSelectionChange}
        headings={[
          { title: 'Title' },
          { title: 'Priority' },
          { title: 'Status' },
          { title: 'Actions' },
        ]}
      >
        {rowMarkup}
      </IndexTable>
    </div>
    {selectedResources.length > 1 && (
      <div style={{ padding: '16px' }}>
        <Button onClick={handleDeleteSelected} destructive loading={isDeleting}>
          Delete Selected
        </Button>
      </div>
    )}
  </LegacyCard>
  
  );
};

export default function ExamplePage() {
  const { products } = useLoaderData();
  const [data, setData] = useState(products);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3004/offers");
        if (response.data) {
          setData(convertDynamoDBData(response.data));
        }
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();
  }, []);

  return (
    <Page
      title="Upsell Offers"
      secondaryActions={[
        {
          content: 'Add an Offer',
          onAction: () => navigate('../new1'),
        },
      ]}
    >
      <MyIndexTable data={data} setData={setData} />
    </Page>
  );
}
