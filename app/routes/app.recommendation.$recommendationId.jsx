import { json } from '@remix-run/node';
import shopify from "./app/shopify.server";
import React, { useState, useEffect } from 'react';
import { useNavigate, useLoaderData, useSubmit, useActionData, useParams } from '@remix-run/react';
import { Page, Card, Form, FormLayout, TextField, Button, Select, Layout, Text, Label, Tag } from '@shopify/polaris';
import MultiAutoCombobox from './combobox';
import { Modal } from '@shopify/app-bridge-react';





export async function loader({ params, request }) {
  const { recommendationId } = params;

  try {
    const { admin } = await shopify.authenticate.admin(request);

    const response = await admin.graphql(`
      {
        products(first: 10, query: "inventory_total:>0") {
          nodes {
            id
            title
          }
        }
      }
    `);
    const sp = await response.json();
    console.log("wq", sp);
    const shopifyProducts = sp.data.products.nodes.map(product => ({
      value: product.id,
      label: product.title
    }));

    const recommendationResponse = await fetch(`http://localhost:3004/recommendation?recommendationId=${recommendationId}`);
    if (!recommendationResponse.ok) {
      throw new Error(`Error fetching data: ${recommendationResponse.statusText}`);
    }
    const recommendationData = await recommendationResponse.json();

    return json({ shopifyProducts, recommendationData });
  } catch (err) {
    console.error('Error occurred:', err);
    return json({ success: false, err }, { status: 500 });
  }
}

export async function action({ request }) {
  const formData = await request.formData();
  const type = formData.get("type");
  if(type=="PUT")
    {
    const recommendation = JSON.parse(formData.get("recommendation"));
  try {
    const response = await fetch(`http://localhost:3004/recommendation`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recommendation),
    });

    if (response.status == 200) {
      console.log('Updated data:', response);
      return json({ success: true, message: "Updated" });
    } else {
      return json({ success: false, message: "Failed" });
    }
  } catch (err) {
    console.error(err);
    return json({ success: false, err });
  }
  }
  else if(type=="DELETE")
  {
    const recommendationId = formData.get("id");
    console.log("offer id------>",recommendationId);
    try {
      const response =  await fetch(`http://localhost:3004/recommendation?offerId=${recommendationId}`, {
         method: 'DELETE',
       })
       if(response.ok)
       {
         console.log("Deleted",response);
         return json({ success: true, message: "Deleted" });

       }
 } catch (err) {
   console.log(err);
   return json({ success: false, err });
 }
  }
}

export default function RecommendationDetails() {
  const { recommendationId } = useParams();
  const { recommendationData, shopifyProducts } = useLoaderData();
  const [recommendation, setRecommendation] = useState(recommendationData || {});
  const [modalOpen, setModalOpen] = useState(false);
  const submit = useSubmit();
  const navigate = useNavigate();
  const actionData = useActionData();

  useEffect(() => {
    if (recommendationData) {
      setRecommendation(recommendationData);
    }
  }, [recommendationData]);

  useEffect(() => {
    if (actionData && actionData.success) {
      navigate('../new');
    }
  }, [actionData, navigate]);

  const handleDelete = async () => {
    const formData = new FormData();
    formData.append("type", "DELETE");
    formData.append("id", recommendationId);
    const res = submit(formData, { replace: true, method: 'DELETE' });
    if (res.success) {
      console.log("deleted");
      navigate("../new");
    } else {
      console.log("some err", res.err);
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("type", "PUT");
    formData.append("recommendation", JSON.stringify(recommendation));
    submit(formData, { replace: true, method: 'PUT' });
  };

  const handleAllProducts = () => {
    setRecommendation({ ...recommendation, triggerProductIds: shopifyProducts.map(p => p.value) });
  };

  if (!recommendation || Object.keys(recommendation).length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <Page
      backAction={{ content: "Recommendation", url: '/app/new' }}
      title={`Editing ${recommendation.title}`}
      secondaryActions={[
        {
          content: "Delete",
          accessibilityLabel: "Secondary action label",
          onAction: handleDelete,
          destructive: true
        },
        {
          content: "Save",
          accessibilityLabel: "Secondary action label",
          onAction: handleSubmit,
        }
      ]}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ marginBottom: '5px' }}>
              <Label><Text variant="bodyMd" fontWeight="bold">Title</Text></Label>
            </div>
            <TextField
              value={recommendation.title || ''}
              onChange={(value) => setRecommendation({ ...recommendation, title: value })}
            />
            <br />
            <div style={{ marginBottom: '5px' }}>
              <Label><Text variant="bodyMd" fontWeight="bold">Priority</Text></Label>
            </div>
            <TextField
              type="number"
              value={recommendation.priority?.toString() || ''}
              onChange={(value) => setRecommendation({ ...recommendation, priority: parseInt(value) })}
            />
          </Card>
        </Layout.Section>
        <Layout.Section variant='oneThird'>
          <Card>
            <Select
              label={<Text variant="bodyMd" fontWeight="bold">Status</Text>}
              options={[
                { label: 'Active', value: 'true' },
                { label: 'Inactive', value: 'false' }
              ]}
              value={recommendation.isEnabled?.toString() || ''}
              onChange={(value) => setRecommendation({ ...recommendation, isEnabled: value === 'true' })}
            />
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <Label><Text variant="bodyMd" fontWeight="bold">Choose the trigger products</Text></Label>
            <div style={{ margin: '10px 0' }}>
              <Button onClick={handleAllProducts}>All Products</Button>
            </div>
            <div>
              <Button onClick={() => setModalOpen(true)}>Choose Trigger Products</Button>
            </div>
            <div style={{margin:'10px 0',display:'flex',gap:'10px'}}>
              {recommendation.triggerProductIds?.map((productId) => {
                const product = shopifyProducts.find(p => p.value === productId);
                return product ? <Tag key={productId} onRemove={() => setRecommendation({ ...recommendation, triggerProductIds: recommendation.triggerProductIds.filter(id => id !== productId) })}>{product.label}</Tag> : null;
              })}
            </div>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <Label><Text variant="bodyMd" fontWeight="bold">Choose the recommendation products</Text></Label>
            <br />
            <MultiAutoCombobox
              options={shopifyProducts}
              selectedOptions={recommendation.recommendedProductIds}
              setSelectedOptions={(selected) => setRecommendation({ ...recommendation, recommendedProductIds: selected })}
              label="Recommended Product IDs"
            />
          </Card>
        </Layout.Section>
      </Layout>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div style={{ margin: '20px' }}>
          <MultiAutoCombobox
            options={shopifyProducts}
            selectedOptions={recommendation.triggerProductIds}
            setSelectedOptions={(selected) => setRecommendation({ ...recommendation, triggerProductIds: selected })}
            label="Select Trigger Products"
          />
        </div>
      </Modal>
    </Page>
  );
}