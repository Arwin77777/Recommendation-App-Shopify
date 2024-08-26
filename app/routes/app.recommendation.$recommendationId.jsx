import { redirect, useActionData, useLoaderData, useNavigate, useSubmit } from '@remix-run/react';
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
import { authenticate } from '../shopify.server';
import { uuid } from 'uuidv4';


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
          return data.length === 0 ? null : data;
        })
        .catch(error => {
          console.error("Error fetching recommendation:", error);
          return null;
        })
      : null;
    return {
      shopifyProducts: shopifyProducts?.data?.products?.nodes,
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
  const isAll = formData.get('isAll');
  console.log("is all or not --------> ",isAll);
  console.log("Within action", triggerProductIds, recommendedProductIds, isEnabled, title, priority, shop);
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
        shop: shop,
        isAll: isAll
      })
    });



    if (!response.ok) {
      const errorMessage = await response.text();
      return { success: false, error: `Failed to save recommendation: ${errorMessage} ` };
    }
    // console.log(response);
    const newRecommendationId = recommendationId == "new" ? id : recommendationId;
    // return redirect(`/app/recommendation/${newRecommendationId}?shop=${shop}`);
    return { success: true, recommendationId: newRecommendationId, shop };
  } catch (err) {
    return { success: false, error: `Error: ${err.message} ` };
  }
}

function MultiselectTagComboboxExample() {
  const { shopifyProducts, existingRecommendation } = useLoaderData();
  const shop = localStorage.getItem("shop");
  const navigate = useNavigate();
  const submit = useSubmit();
  const actionData = useActionData();

  const [formState, setFormState] = useState({
    priority: existingRecommendation ? existingRecommendation.priority : null,
    isEnabled: existingRecommendation ? (existingRecommendation.isEnabled === 'true' || existingRecommendation.isEnabled === true) : false,
    recommendationName: existingRecommendation ? existingRecommendation.title : '',
    triggerProducts: new Map(existingRecommendation ? existingRecommendation.triggerProductIds.map(id => [id, shopifyProducts.find(product => product.id === id).title]) : []),
    recommendedProducts: new Map(existingRecommendation ? existingRecommendation.recommendedProductIds.map(id => [id, shopifyProducts.find(product => product.id === id).title]) : []),
    type: existingRecommendation ? (existingRecommendation.triggerProductIds.length === shopifyProducts.length ? 'all' : 'specific') : '',
    selectedOptions: existingRecommendation ? (existingRecommendation.triggerProductIds.length === shopifyProducts.length ? 'all' : 'specific') : '',
    errors: {
      titleError: '',
      priorityError: '',
      triggerProductsError: '',
      recommendedProductsError: '',
    },
  });

  useEffect(() => {
    if (actionData) {
      if (actionData.error) {
        console.error('Error saving recommendation:', actionData.error);
      } else if (actionData.success) {
        shopify.toast.show('Product saved', {
          duration: 2000,
        });
        setTimeout(() => {
          navigate(`/app/recommendation/${actionData.recommendationId}?shop=${actionData.shop}`);
        }, 2000);
      }
    }
  }, [actionData, navigate]);

  const handleChange = (field, value) => {
    setFormState((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  const handleErrorChange = (field, value) => {
    setFormState((prevState) => ({
      ...prevState,
      errors: {
        ...prevState.errors,
        [field]: value,
      },
    }));
  };

  const handleTriggerSelect = async () => {
    const transformedTriggerIds = Array.from(formState.triggerProducts.keys()).map(id => ({ id }));
    const selected = await shopify.resourcePicker({
      type: 'product',
      multiple: true,
      selectionIds: transformedTriggerIds,
      filter: {
        variants: false,
      },
    });

    const selectedProductMap = new Map();
    selected.forEach(product => {
      selectedProductMap.set(product.id, product.title);
    });

    handleChange('triggerProducts', selectedProductMap);
  };

  const handleRecommendSelect = async () => {
    const transformedRecommendIds = Array.from(formState.recommendedProducts.keys()).map(id => ({ id }));
    const selected = await shopify.resourcePicker({
      type: 'product',
      multiple: true,
      selectionIds: transformedRecommendIds,
      filter: {
        variants: false,
      },
    });

    const selectedRecommendationMap = new Map();
    selected.forEach(product => {
      selectedRecommendationMap.set(product.id, product.title);
    });

    handleChange('recommendedProducts', selectedRecommendationMap);
  };


  const validateForm = (formState) => {
    const errors = {
      titleError: '',
      priorityError: '',
      triggerProductsError: '',
      recommendedProductsError: ''
    };

    let isValid = true;

    if (!formState.recommendationName.trim()) {
      errors.titleError = 'Title is required';
      isValid = false;
    }
    if (formState.priority == null || formState.priority <= 0) {
      errors.priorityError = 'Priority must be greater than 0';
      isValid = false;
    }
    if (formState.triggerProducts.size === 0 && formState.type!='all') {
      errors.triggerProductsError = 'At least one trigger product must be selected';
      isValid = false;
    }
    if (formState.recommendedProducts.size === 0) {
      errors.recommendedProductsError = 'At least one recommendation product must be selected';
      isValid = false;
    }

    return { isValid, errors };
  };


  const handleSave = () => {
    const { isValid, errors } = validateForm(formState);
    handleErrorChange('titleError', errors.titleError);
    handleErrorChange('priorityError', errors.priorityError);
    handleErrorChange('triggerProductsError', errors.triggerProductsError);
    handleErrorChange('recommendedProductsError', errors.recommendedProductsError);

    if (!isValid) {
      return;
    }

    const formData = new FormData();
    formState.triggerProducts.forEach((title, id) => {
      formData.append('selectedProducts', JSON.stringify([id, title]));
    });

    formState.recommendedProducts.forEach((title, id) => {
      formData.append('selectedRecommendations', JSON.stringify([id, title]));
    });
    formData.append('title', formState.recommendationName);
    formData.append('priority', formState.priority);
    formData.append('isEnabled', formState.isEnabled.toString());
    formData.append('shop', shop);
    formData.append('isAll',formState.type=='all'?true:false);

    submit(formData, { method: 'post' });
  };

  const handleAllProducts = async () => {
    handleChange('triggerProducts',new Map());
    handleChange('type', 'all');
    // const productsMap = new Map(shopifyProducts.map(product => [product.id, product.title]));
    // handleChange('triggerProducts', productsMap);
  };

  const handleOptionChange = (value) => {
    handleChange('selectedOptions', value);
    if (value === 'all') {
      handleChange('type', 'all');
      handleAllProducts();
    } else {
      handleChange('triggerProducts', new Map());
      handleChange('type', 'specific');
    }
  };

  const removeTag = (type, tag) => {
    return () => {
      setFormState((prevState) => {
        const updatedTags = new Map(prevState[type]);
        updatedTags.delete(tag);
        return {
          ...prevState,
          [type]: updatedTags,
        };
      });
    };
  };

  const handleDelete = async () => {
    const id = existingRecommendation.offerId;
    try {
      await fetch(`http://localhost:3004/recommendation?offerId=${id}&shop=${shop}`, {
        method: 'DELETE',
      })
      shopify.toast.show('Offer deleted ', {
        duration: 2000,
      });
      navigate('../');
    }
    catch (err) {
      console.log("Error", err);
      shopify.toast.show('Failed to delete offer', {
        duration: 2000,
      });
    }
  }

  return (
    <Page
      backAction={{ content: "Offer", url: '/app' }}
      title={existingRecommendation ? `Editing ${formState.recommendationName}` : 'Add Offer'}
      primaryAction={{
        content: 'Save',
        onAction: handleSave,
      }}
      secondaryActions={[
        ...(existingRecommendation ? [{
          content: "Delete",
          destructive: true,
          onAction: handleDelete,

        }] : [])
      ]}
    >
      <div style={{ marginBottom: '20px' }}>
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ marginBottom: '10px' }}>
                <label><b>Title</b></label>
              </div>
              <TextField
                placeholder="Example Title"
                value={formState.recommendationName}
                onChange={(value) => handleChange('recommendationName', value)}
                autoComplete='off'
                error={formState.errors.titleError}
              />
            </Card>
          </Layout.Section>

          <Layout.Section oneThird>
            <Card>
              <Label><b>Status</b></Label>
              <Checkbox
                label="Enable"
                checked={formState.isEnabled}
                onChange={() => handleChange('isEnabled', !formState.isEnabled)}
              />
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <div style={{ marginBottom: '10px' }}>
                <label><b>Priority</b></label>
              </div>
              <TextField
                placeholder="1"
                type="number"
                value={formState.priority || ''}
                onChange={(value) => handleChange('priority', value)}
                autoComplete='off'
                error={formState.errors.priorityError}
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
                  checked={formState.selectedOptions === 'all'}
                  onChange={() => handleOptionChange('all')}
                />
              </div>
              <div style={{ margin: '10px 0' }}>
                <RadioButton
                  label="Specific Products"
                  checked={formState.selectedOptions === 'specific'}
                  onChange={() => handleOptionChange('specific')}
                />
              </div>
              {formState.type === 'specific' ?
                (<div>
                  <Button onClick={handleTriggerSelect}>Select Product</Button>
                  <p style={{ color: 'gray', marginTop: '10px' }}>*The offer will be applied for selected products</p>
                  <div style={{ display: 'flex', margin: '10px 0px', gap: '10px' }}>
                    {Array.from(formState.triggerProducts.keys()).map((key) => (
                      <div key={key}>
                        <Tag onRemove={removeTag('triggerProducts', key)}>{formState.triggerProducts.get(key)}</Tag>
                      </div>
                    ))}
                  </div>
                </div>)
                : formState.type === 'all' ?
                  (<p style={{ color: 'gray', marginTop: '10px' }}>*The offer will be applied for all products</p>) : (<p></p>)
              }
              {formState.errors.triggerProductsError && <p style={{ color: 'red' }}>{formState.errors.triggerProductsError}</p>}
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <div style={{ marginBottom: '10px' }}>
                <label><b>Recommended Products</b></label>
              </div>
              <Button onClick={handleRecommendSelect}>Select Product</Button>
              <p style={{ color: 'gray', marginTop: '10px' }}>*Recommended products will be suggested to the user</p>
              <div style={{ display: 'flex', margin: '10px 0px', gap: '10px' }}>
                {Array.from(formState.recommendedProducts.keys()).map((key) => (
                  <div key={key}>
                    <Tag onRemove={removeTag('recommendedProducts', key)}>{formState.recommendedProducts.get(key)}</Tag>
                  </div>
                ))}
              </div>
              {formState.errors.recommendedProductsError && <p style={{ color: 'red' }}>{formState.errors.recommendedProductsError}</p>}
            </Card>
          </Layout.Section>
        </Layout>
      </div>
    </Page>
  );
}

export default MultiselectTagComboboxExample;