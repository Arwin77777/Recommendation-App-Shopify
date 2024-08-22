import { Button, IndexTable, LegacyCard, Link, Page, Text, useIndexResourceState } from '@shopify/polaris';
import React, { useEffect, useState } from 'react';
import { fetchProducts } from '../server/dbUtil';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { EditIcon } from '@shopify/polaris-icons';

export async function loader({ request }) {
    try {
        const url = new URL(request.url);
        const shop = url.searchParams.get("shop");
        const response = await fetchProducts();
        return { orders: response.data, shop: shop };
    } catch (err) {
        
        return { orders: [], error: 'Failed to fetch data' };
    }
}

const Table = () => {
    const navigate = useNavigate();
    const { orders, error, shop: loaderShop } = useLoaderData();
    const shop = loaderShop || localStorage.getItem("shop");


    const [renamedOrders, setRenamedOrders] = useState(
        orders.map(({ offerId, ...rest }) => ({
            id: offerId,
            ...rest
        }))
    );

    const { clearSelection, selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(renamedOrders || []);

    useEffect(() => {
        if (shop) {
            
            localStorage.setItem("shop", shop);
        }
    }, [shop]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    const resourceName = {
        singular: 'order',
        plural: 'orders',
    };

    const handleDeleteSelected = async () => {
        try {
            await Promise.all(
                selectedResources.map((id) =>
                    fetch(`http://localhost:3004/recommendation?offerId=${id}&shop=${shop}`, {
                        method: 'DELETE',
                    })
                )
            );
            setRenamedOrders((prevOrders) =>
                prevOrders.filter((order) => !selectedResources.includes(order.id))
            );
            clearSelection();
            // Show success message using Shopify's toast or any other toast library
            
        } catch (err) {
            console.error('Failed to delete offers:', err);
            // Show an error message
            
        }
    };

    const rowMarkup = (renamedOrders || []).map(
        ({ id, title, priority, isEnabled }, index) => (
            <IndexTable.Row
                id={id}
                key={id}
                selected={selectedResources.includes(id)}
                position={index}
            >
                <IndexTable.Cell>
                    <Text variant="bodyMd" fontWeight="bold" as="span">
                        {title}
                    </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>{priority}</IndexTable.Cell>
                <IndexTable.Cell>
                    {isEnabled === true || isEnabled === 'true' ? 'Active' : 'Inactive'}
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Link
                            url={`./recommendation/${id}?shop=${shop}`}
                            onClick={(event) => {
                                event.stopPropagation();
                            }}
                        >
                            <Button icon={EditIcon} />
                        </Link>
                    </div>
                </IndexTable.Cell>
            </IndexTable.Row>
        ),
    );

    return (
        <Page
            title="Upsell Offers"
            secondaryActions={[
                {
                    content: 'Add an Offer',
                    onAction: () => navigate(`/app/recommendation/new`),
                },
            ]}
        >
            <div>
                <LegacyCard>
                    <IndexTable
                        resourceName={resourceName}
                        itemCount={(renamedOrders || []).length}
                        selectedItemsCount={
                            allResourcesSelected ? 'All' : selectedResources.length
                        }
                        onSelectionChange={handleSelectionChange}
                        headings={[
                            { title: 'Title' },
                            { title: 'Priority' },
                            { title: 'Status' },
                            { title: 'Edit' },
                        ]}
                    >
                        {rowMarkup}
                    </IndexTable>
                    {selectedResources.length > 0 && (
                        <div style={{ padding: '16px' }}>
                            <Button onClick={handleDeleteSelected} destructive>
                                Delete Selected
                            </Button>
                        </div>
                    )}
                </LegacyCard>
            </div>
        </Page>
    );
}

export default Table;
