import { Button, IndexTable, LegacyCard, Link, Page, Text, useIndexResourceState } from '@shopify/polaris';
import React, { useEffect, useState } from 'react';
import { fetchAllProducts } from '../server/dbUtil';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { EditIcon } from '@shopify/polaris-icons';

export async function loader({ request }) {
    try {
        const url = new URL(request.url);
        const shop = url.searchParams.get("shop");
        console.log("In loader",url);
        const response = await fetchAllProducts();
        return { offers: response.data, shop: shop };
    } catch (err) {
        return { offers: [], error: 'Failed to fetch data' };
    }
}

const Table = () => {

    const navigate = useNavigate();
    const { offers, error, shop: loaderShop } = useLoaderData();
    const [shop, setShop] = useState(loaderShop || '');

    useEffect(() => {
        if (loaderShop) {
            localStorage.setItem("shop", loaderShop);
            setShop(loaderShop);
        } else {
            const storedShop = localStorage.getItem("shop");
            if (storedShop) {
                setShop(storedShop);
            }
        }
    }, [loaderShop]);

    const [renamedOffers, setRenamedOffers] = useState(
        offers.map(({ offerId, ...rest }) => ({
            id: offerId,
            ...rest
        }))
    );

    const { clearSelection, selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(renamedOffers || []);

    

    if (error) {
        return <div>Error: {error}</div>;
    }

    const resourceName = {
        singular: 'Offer',
        plural: 'Offers',
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
            setRenamedOffers((prevOffers) =>
                prevOffers.filter((offer) => !selectedResources.includes(offer.id))
            );
            clearSelection();

        } catch (err) {
            console.error('Failed to delete offers:', err);

        }
    };

    const rowMarkup = (renamedOffers || []).map(
        ({ id, title, priority, isEnabled }, index) => {
            return (
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
            );
        }  
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
                        itemCount={(renamedOffers || []).length}
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
