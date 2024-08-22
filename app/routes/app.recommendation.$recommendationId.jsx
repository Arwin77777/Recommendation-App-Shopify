import { useActionData, useLoaderData, useNavigate, useSubmit } from '@remix-run/react';
import {
  Page,
  Card,
  Button,
  TextField,
  Layout,
  Checkbox,
  RadioButton,
  Label,
  Tag,
} from '@shopify/polaris';
import { useState, useEffect } from 'react';
import { v4 as uuid } from "uuid";
import { authenticate } from '../shopify.server';


export async function loader({ request, params }) {
  try {
    const { admin } = await authenticate.admin(request);

    const response = await admin.graphql(`
      {
        products(first: 250, query: "inventory_total:>0") {
          nodes {
            id
            title
          }
        }
      }
    `);

    const url = new URL(request.url);
    const shop = url.searchParams.get("shop")



    const shopifyProducts = await response.json();

    const { recommendationId } = params
    const existingRecommendation = recommendationId
      ? await fetch(`http://localhost:3004/recommendation?recommendationId=${recommendationId}&shop=${shop}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {

          if (data.length === 0)
            return null;
          return data;
        })
        .catch(error => {
          console.error("Error fetching recommendation:", error);
          return null;
        })
      : null;


    return {
      shopifyProducts: shopifyProducts.data.products.nodes,
      existingRecommendation,
      shop: shop
    };
  } catch (err) {

    return { err };
  }
}

export async function action({ request, params }) {
  const formData = await request.formData();

  const selectedProductsMap = new Map(formData.getAll("selectedProducts").map(item => JSON.parse(item)));
  const selectedRecommendationsMap = new Map(formData.getAll("selectedRecommendations").map(item => JSON.parse(item)));

  const triggerProductIds = Array.from(selectedProductsMap.keys());
  const recommendedProductIds = Array.from(selectedRecommendationsMap.keys());
  const title = formData.get("title");
  const isEnabled = formData.get("isEnabled") === 'true';
  const e = isEnabled ? "true" : "false";
  const { recommendationId } = params;
  const priority = Number(formData.get("priority"));
  const shop = formData.get("shop");

  const id = uuid();
  try {
    const response = await fetch(`http://localhost:3004/recommendation?shop=${shop}`, {
      method: params.recommendationId != 'new' ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        offerId: recommendationId == "new" ? id : recommendationId,
        title,
        priority,
        triggerProductIds: triggerProductIds,
        recommendedProductIds: recommendedProductIds,
        isEnabled: e,
        shop: shop
      })
    });



    if (!response.ok) {
      const errorMessage = await response.text();
      return { success: false, error: `Failed to save recommendation: ${errorMessage}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: `Error: ${err.message}` };
  }
}

function MultiselectTagComboboxExample() {
  const { shopifyProducts, existingRecommendation } = useLoaderData();
  const shop = localStorage.getItem("shop")
  const navigate = useNavigate();
  const [priority, setPriority] = useState(existingRecommendation ? existingRecommendation.priority : 1);
  const [isEnabled, setIsEnabled] = useState(() => {
    if (existingRecommendation && existingRecommendation.isEnabled) {
      return existingRecommendation.isEnabled === 'true' || existingRecommendation.isEnabled === true;
    }
    return false;
  });
  const [recommendationName, setRecommendationName] = useState(existingRecommendation ? existingRecommendation.title : '');
  const [triggerProducts, setTriggerProducts] = useState(new Map(existingRecommendation != null ? existingRecommendation.triggerProductIds.map(id => [id, shopifyProducts.find(product => product.id === id).title]) : []));
  const [recommendedProducts, setRecommendedProducts] = useState(new Map(existingRecommendation != null ? existingRecommendation.recommendedProductIds.map(id => [id, shopifyProducts.find(product => product.id === id).title]) : []));
  const [error, setError] = useState('');
  const actionData = useActionData();
  const [isSpecific, setIsSpecific] = useState(existingRecommendation ? (existingRecommendation.triggerProductIds.length === shopifyProducts.length ? 'all' : 'specific') : '');
  // 
  const [selectedOption, setSelectedOption] = useState(existingRecommendation ? (existingRecommendation.triggerProductIds.length === shopifyProducts.length ? 'all' : 'specific') : '');
  const submit = useSubmit();





  useEffect(() => {
    if (actionData && actionData.success) {
      shopify.toast.show('Product saved', {
        duration: 2000,
      });
      navigate('../');
    } else if (actionData && actionData.error) {
      setError(actionData.error);
    }
  }, [actionData, navigate]);

  const handleTriggerSelect = async () => {
    const t1 = Array.from(triggerProducts.keys());
    const transformedTriggerIds = t1.map(id => ({ id }));
    const selected = await shopify.resourcePicker({
      type: 'product',
      showVariants: false,
      multiple: true,
      selectionIds: transformedTriggerIds
    });

    const selectedProductMap = new Map();
    selected.forEach(product => {
      selectedProductMap.set(product.id, product.title);
    });

    setTriggerProducts(selectedProductMap);
  };

  const handleRecommendSelect = async () => {
    const t = Array.from(recommendedProducts.keys());
    const transformedRecommendIds = t.map(id => ({ id }));
    const selected = await shopify.resourcePicker({
      type: 'product',
      showVariants: false,
      multiple: true,
      selectionIds: transformedRecommendIds
    });

    const selectedRecommendationMap = new Map();
    selected.forEach(product => {
      selectedRecommendationMap.set(product.id, product.title);
    });

    setRecommendedProducts(selectedRecommendationMap);
  };

  const handleSave = () => {
    if (!recommendationName.trim()) {
      setError('Title is required');
      return;
    }
    if (priority <= 0) {
      setError('Priority must be greater than 0');
      return;
    }
    if (triggerProducts.size === 0) {
      setError('At least one trigger product must be selected');
      return;
    }
    if (recommendedProducts.size === 0) {
      setError('At least one recommendation product must be selected');
      return;
    }

    const formData = new FormData();
    triggerProducts.forEach((title, id) => {
      formData.append('selectedProducts', JSON.stringify([id, title]));
    });
    recommendedProducts.forEach((title, id) => {
      formData.append('selectedRecommendations', JSON.stringify([id, title]));
    });
    formData.append('title', recommendationName);
    formData.append('priority', priority);
    formData.append('isEnabled', isEnabled.toString());
    formData.append('shop', shop)


    submit(formData, { method: 'post' });
  };

  const handleAllProducts = async () => {
    const productsMap = new Map(shopifyProducts.map(product => [product.id, product.title]));
    setTriggerProducts(productsMap);
  };

  const handleOptionChange = (value) => {
    setSelectedOption(value);
    if (value === 'all') {
      setIsSpecific('all');
      handleAllProducts();
    } else {
      setTriggerProducts(new Map());
      setIsSpecific('specific');
    }
  };

  const removeTag = (tag) => {
    return () => {
      setRecommendedProducts((previousTags) => {
        const updatedTags = new Map(previousTags);
        updatedTags.delete(tag);
        return updatedTags;
      });
    };
  };

  const removeTag1 = (tag) => {
    return () => {
      setTriggerProducts((previousTags) => {
        const updatedTags = new Map(previousTags);
        updatedTags.delete(tag);
        return updatedTags;
      });
    };
  };

  return (
    <Page
      backAction={{ content: "Offer", url: '/app' }}
      title={existingRecommendation ? `Editing ${recommendationName}` : 'Add Offer'}
      secondaryActions={[{
        content: "Save",
        onAction: handleSave,
      }]}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ marginBottom: '10px' }}>
              <label><b>Title</b></label>
            </div>
            <TextField
              placeholder="Example Title"
              value={recommendationName}
              onChange={setRecommendationName}
              autoComplete='off'
              error={error && !recommendationName.trim() ? error : null}
            />
            <div style={{ margin: '10px 0' }}>
              <label><b>Priority</b></label>
            </div>
            <TextField
              placeholder="1"
              type="number"
              value={priority || ''}
              onChange={setPriority}
              autoComplete='off'
              error={error && priority <= 0 ? error : null}
            />
          </Card>
        </Layout.Section>

        <Layout.Section oneThird>
          <Card>
            <Label><b>Status</b></Label>
            <Checkbox
              label="Enable"
              checked={isEnabled}
              onChange={() => setIsEnabled(!isEnabled)}
            />
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ marginBottom: '10px' }}>
              <label><b>Trigger Products</b></label>
            </div>
            <div style={{ margin: '10px 0' }}>
              <RadioButton
                label="All Products"
                checked={selectedOption === 'all'}
                onChange={() => handleOptionChange('all')}
              />
            </div>
            <div style={{ margin: '10px 0' }}>
              <RadioButton
                label="Specific Products"
                checked={selectedOption === 'specific'}
                onChange={() => handleOptionChange('specific')}
              />
            </div>
            {isSpecific === 'specific' ?
              (<div>
                <Button onClick={handleTriggerSelect}>Select Product</Button>
                <p style={{ color: 'gray', marginTop: '10px' }}>*The offer will be applied for selected products</p>
                <div style={{ display: 'flex', margin: '10px 0px', gap: '10px' }}>
                  {Array.from(triggerProducts.keys()).map((key) => (
                    <div key={key}>
                      <Tag onRemove={removeTag1(key)}>{triggerProducts.get(key)}</Tag>
                    </div>
                  ))}
                </div>
              </div>) : isSpecific === 'all' ?
                (<p style={{ color: 'gray', marginLeft: '10px' }}>*The offer will be applied for all products</p>)
                : (<p></p>)
            }
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ marginBottom: '10px' }}>
              <label><b>Recommended Products</b></label>
            </div>
            <Button onClick={handleRecommendSelect}>Choose Products</Button>
            <div style={{ display: 'flex', margin: '10px 0px', gap: '10px' }}>
              {Array.from(recommendedProducts.keys()).map((key) => (
                <div key={key}>
                  <Tag onRemove={removeTag(key)}>{recommendedProducts.get(key)}</Tag>
                </div>
              ))}
            </div>
          </Card>
        </Layout.Section>

        {error && (
          <Layout.Section>
            <Card sectioned title="Error">
              <p>{error}</p>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}

export default MultiselectTagComboboxExample;
