import { Navigate, useActionData, useLoaderData, useNavigate, useSubmit } from '@remix-run/react';
import {
  LegacyStack,
  Tag,
  Listbox,
  EmptySearchResult,
  Combobox,
  Text,
  AutoSelection,
  Page,
  Card,
  Button,
  TextField,
  Layout,
  Grid,
  Box,
  Checkbox,
  BlockStack,
  RadioButton,
} from '@shopify/polaris';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { v4 as uuid } from "uuid";
import {
  ChevronLeftIcon
} from '@shopify/polaris-icons';
import shopify from "./app/shopify.server";
import { Modal, useAppBridge, TitleBar } from '@shopify/app-bridge-react';

export async function loader({ request }) {
  const { admin } = await shopify.authenticate.admin(request);

  const response = await admin.graphql(`
    {
      products(first: 10, query: "inventory_total:>0") {
        nodes {
          createdAt
          description
          id
          title
          totalInventory
          updatedAt
          tracksInventory
          category {
            id
            fullName
          }
        }
      }
    }
  `);

  const shopifyProducts = await response.json();
  return { shopifyProducts: shopifyProducts.data.products.nodes };
}

export async function action({ request }) {
  const { admin } = await shopify.authenticate.admin(request);
  const formData = await request.formData();
  const selectedProductsId = formData.getAll("selectedProductsId");
  const selectedRecommendationsId = formData.getAll("selectedRecommendationsId");
  const title = formData.get("title");
  const isEnabled = formData.get("isEnabled");
  const priority = Number(formData.get("priority"));
  const recommendationId = uuid();
  console.log("Selected Products:", selectedProductsId);
  console.log("Selected Recommendations:", selectedRecommendationsId);
  if (admin) {
    try {
      const response = await fetch('http://localhost:3004/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recommendationId: recommendationId,
          title: title,
          priority: priority,
          triggerProductIds: selectedProductsId,
          recommendedProductIds: selectedRecommendationsId,
          isEnabled: isEnabled
        })
      });
      console.log("-=-", response);
      if (response.status == 200) {
        // const data = await response.json();
        console.log(await response.json());
        return { success: true };
      }
      else {
        return { success: false, error: 'Failed to add recommendation' };
      }
    }
    catch (err) {
      console.log(err);
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: 'Not authenticated' };
}

function MultiselectTagComboboxExample() {
  const navigate = useNavigate();
  const { shopifyProducts } = useLoaderData();
  const [priority, setPriority] = useState(0);
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState(new Map());
  const [recommendationName, setReccomendationName] = useState('');
  const [selectedRecommendations, setSelectedRecommendations] = useState(new Map());
  const [value, setValue] = useState('');
  const [recommendationValue, setRecommendationValue] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [recommendationSuggestion, setRecommendationSuggestion] = useState('');
  const actionData = useActionData();
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const shopify = useAppBridge();
  const submit = useSubmit();

  useEffect(() => {
    if (actionData && actionData.success) {
      navigate('../');
    } else if (actionData && actionData.error) {
      setError(actionData.error);
    }
  }, [actionData, navigate])

  const handleTrigger = async () => {
    if (!recommendationName.trim()) {
      setError('Title is required');
      return;
    }
    if (priority <= 0) {
      setError('Priority must be greater than 0');
      return;
    }
    if (selectedProducts.size === 0) {
      setError('At least one product must be selected');
      return;
    }
    if (selectedRecommendations.size === 0) {
      setError('At least one recommendation must be selected');
      return;
    }

    setError('');
    const selectedProductsId = Array.from(selectedProducts.values());
    const selectedRecommendationsId = Array.from(selectedRecommendations.values());

    const formData = new FormData();
    selectedProductsId.forEach(id => formData.append('selectedProductsId', id));
    selectedRecommendationsId.forEach(id => formData.append('selectedRecommendationsId', id));
    formData.append("title", recommendationName);
    formData.append("priority", priority);
    formData.append("isEnabled", isEnabled);

    submit(formData, { replace: true, method: 'POST' });
  };


  const handleEnable = async () => {
    setIsEnabled(!isEnabled);
  }

  const handleActiveOptionChange = useCallback(
    (activeOption) => {
      const activeOptionIsAction = activeOption === value;

      if (!activeOptionIsAction && !selectedProducts.has(activeOption)) {
        setSuggestion(activeOption);
      } else {
        setSuggestion('');
      }
    },
    [value, selectedProducts],
  );

  const updateSelection = useCallback(
    (selected) => {
      const product = shopifyProducts.find(p => p.title === selected);
      const nextSelectedProducts = new Map(selectedProducts);

      if (nextSelectedProducts.has(product.title)) {
        nextSelectedProducts.delete(product.title);
      } else {
        nextSelectedProducts.set(product.title, product.id);
      }

      setSelectedProducts(nextSelectedProducts);
      setValue('');
      setSuggestion('');
    },
    [selectedProducts, shopifyProducts],
  );

  const removeTag = useCallback(
    (tag) => () => {
      updateSelection(tag);
    },
    [updateSelection],
  );

  const getAllTags = useCallback(() => {
    const savedTags = shopifyProducts.map(p => p.title);
    return [...new Set([...savedTags, ...selectedProducts.keys()].sort())];
  }, [selectedProducts, shopifyProducts]);

  const handleRecommendationActiveOptionChange = useCallback(
    (activeOption) => {
      const activeOptionIsAction = activeOption === recommendationValue;

      if (!activeOptionIsAction && !selectedRecommendations.has(activeOption)) {
        setRecommendationSuggestion(activeOption);
      } else {
        setRecommendationSuggestion('');
      }
    },
    [recommendationValue, selectedRecommendations],
  );

  const updateRecommendationSelection = useCallback(
    (selected) => {
      const product = shopifyProducts.find(p => p.title === selected);
      const nextSelectedRecommendations = new Map(selectedRecommendations);

      if (nextSelectedRecommendations.has(product.title)) {
        nextSelectedRecommendations.delete(product.title);
      } else {
        nextSelectedRecommendations.set(product.title, product.id);
      }

      setSelectedRecommendations(nextSelectedRecommendations);
      setRecommendationValue('');
      setRecommendationSuggestion('');
    },
    [selectedRecommendations, shopifyProducts],
  );

  const removeRecommendationTag = useCallback(
    (tag) => () => {
      updateRecommendationSelection(tag);
    },
    [updateRecommendationSelection],
  );

  const getAllRecommendationTags = useCallback(() => {
    const savedTags = shopifyProducts.map(p => p.title);
    const selectedProductTitles = new Set(selectedProducts.keys());
    return [...new Set([...savedTags].sort())].filter(tag => !selectedProductTitles.has(tag));
  }, [selectedProducts, shopifyProducts]);

  const formatOptionText = useCallback(
    (option) => {
      const trimValue = value.trim().toLowerCase();
      const matchIndex = option.toLowerCase().indexOf(trimValue);

      if (!value || matchIndex === -1) return option;

      const start = option.slice(0, matchIndex);
      const highlight = option.slice(matchIndex, matchIndex + trimValue.length);
      const end = option.slice(matchIndex + trimValue.length, option.length);

      return (
        <p>
          {start}
          <Text fontWeight="bold" as="span">
            {highlight}
          </Text>
          {end}
        </p>
      );
    },
    [value],
  );

  const escapeSpecialRegExCharacters = useCallback(
    (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    [],
  );

  const options = useMemo(() => {
    let list;
    const allTags = getAllTags();
    const filterRegex = new RegExp(escapeSpecialRegExCharacters(value), 'i');

    if (value) {
      list = allTags.filter((tag) => tag.match(filterRegex));
    } else {
      list = allTags;
    }

    return [...list];
  }, [value, getAllTags, escapeSpecialRegExCharacters]);

  const recommendationOptions = useMemo(() => {
    let list;
    const allTags = getAllRecommendationTags();
    const filterRegex = new RegExp(escapeSpecialRegExCharacters(recommendationValue), 'i');

    if (recommendationValue) {
      list = allTags.filter((tag) => tag.match(filterRegex));
    } else {
      list = allTags;
    }

    return [...list];
  }, [recommendationValue, getAllRecommendationTags, escapeSpecialRegExCharacters]);


  const verticalContentMarkup = selectedProducts.size > 0 ? (
    <div>
      <br />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {[...selectedProducts.keys()].map((title) => (
          <Tag
            key={selectedProducts.get(title)}
            onRemove={() => removeTag(title)}
            style={{ margin: '4px' }}
          >
            {title}
          </Tag>
        ))}
      </div>
      <br />
    </div>
  ) : null;

  const recommendationVerticalContentMarkup = selectedRecommendations.size > 0 ? (
    <div>
      <br />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {[...selectedRecommendations.keys()].map((title) => (
          <Tag
            key={selectedRecommendations.get(title)}
            onRemove={() => removeRecommendationTag(title)}
            style={{ margin: '4px' }}
          >
            {title}
          </Tag>
        ))}
      </div>
      <br />
    </div>
  ) : null;


  const optionMarkup =
    options.length > 0
      ? options.map((option) => (
        <Listbox.Option
          key={option}
          value={option}
          selected={selectedProducts.has(option)}
          accessibilityLabel={option}
        >
          <Listbox.TextOption selected={selectedProducts.has(option)}>
            {formatOptionText(option)}
          </Listbox.TextOption>
        </Listbox.Option>
      ))
      : null;

  const recommendationOptionMarkup =
    recommendationOptions.length > 0
      ? recommendationOptions.map((option) => (
        <Listbox.Option
          key={option}
          value={option}
          selected={selectedRecommendations.has(option)}
          accessibilityLabel={option}
        >
          <Listbox.TextOption selected={selectedRecommendations.has(option)}>
            {formatOptionText(option)}
          </Listbox.TextOption>
        </Listbox.Option>
      ))
      : null;

  const noResults = value && !getAllTags().includes(value);

  const actionMarkup = noResults ? (
    <Listbox.Action value={value}>{`Add "${value}"`}</Listbox.Action>
  ) : null;

  const emptyStateMarkup = optionMarkup ? null : (
    <EmptySearchResult
      title=""
      description={`No tags found matching "${value}"`}
    />
  );

  const recommendationNoResults = recommendationValue && !getAllRecommendationTags().includes(recommendationValue);

  const recommendationActionMarkup = recommendationNoResults ? (
    <Listbox.Action value={recommendationValue}>{`Add "${recommendationValue}"`}</Listbox.Action>
  ) : null;

  const recommendationEmptyStateMarkup = recommendationOptionMarkup ? null : (
    <EmptySearchResult
      title=""
      description={`No tags found matching "${recommendationValue}"`}
    />
  );

  const listboxMarkup =
    optionMarkup || actionMarkup || emptyStateMarkup ? (
      <Listbox
        autoSelection={AutoSelection.None}
        onSelect={updateSelection}
        onActiveOptionChange={handleActiveOptionChange}
      >
        {actionMarkup}
        {optionMarkup}
      </Listbox>
    ) : null;

  const recommendationListboxMarkup =
    recommendationOptionMarkup || recommendationActionMarkup || recommendationEmptyStateMarkup ? (
      <Listbox
        autoSelection={AutoSelection.None}
        onSelect={updateRecommendationSelection}
        onActiveOptionChange={handleRecommendationActiveOptionChange}
      >
        {recommendationActionMarkup}
        {recommendationOptionMarkup}
      </Listbox>
    ) : null;

  const handleAllProducts = () => {
    setSelectedProducts(new Map(shopifyProducts.map((product) => [product.title, product.id])));
  }
  const [selectedOption, setSelectedOption] = useState('');
  const [isSpecific, setIsSpecific] = useState('');
  const handleOptionChange = (value) => {
    setSelectedOption(value);
    if (value === 'all') {
      setIsSpecific('all');
      handleAllProducts();
    } else {
      setSelectedProducts(new Map());
      setIsSpecific('specific');


      // Handle logic for 'Specific Products' if necessary
    }
  };

  return (
    <Page backAction={{ content: "Offer", url: '/app' }} title='Add Offer'
      secondaryActions={[
        {
          content: "Save",
          accessibilityLabel: "Secondary action label",
          onAction: () => handleTrigger(),
        }
      ]}
    >
      <Layout>

        {/* {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>} */}
        <Layout.Section>
          <Card>
            <div style={{ marginBottom: '10px' }}>
              <label><b>Title</b></label>
            </div>
            <TextField placeholder='Example Title' value={recommendationName} onChange={(e) => setReccomendationName(e)} autoComplete='off' error={error.length > 0 && !recommendationName.trim() ? 'Title is required' : null}></TextField>
            <br />
            <div style={{ marginBottom: '10px' }}>
              <label><b>Priority</b></label>
            </div>
            <TextField placeholder='0' type='number' value={priority == 0 ? null : priority} onChange={(e) => setPriority(e)} autoComplete='off' error={error.length > 0 && priority <= 0 ? 'Priority must be greater than 0' : null}></TextField>
          </Card>
        </Layout.Section>
        <Layout.Section variant='oneThird'>
          <Card>
            <div style={{ marginBottom: '10px' }}>
              <label><b>Status</b></label>
            </div>
            <Checkbox
              label="Enable"
              checked={isEnabled}
              onChange={handleEnable}
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
            {isSpecific==='specific' ?
              (<div>
                <Button onClick={() => shopify.modal.show('my-modal')}>Choose Products</Button>
                <p style={{ color: 'gray', marginTop: '10px' }}>*The offer will be applied for selected products</p>
              </div>) : isSpecific==='all' ?
              (<p style={{ color: 'gray', marginLeft: '10px' }}>*The offer will be applied for all products</p>)
              :(<p></p>)
            }

            {/* {verticalContentMarkup} */}
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <div style={{ marginBottom: '10px' }}>
              <label><b>Recommendation Products</b></label>
            </div>
            <Combobox

              allowMultiple
              activator={
                <Combobox.TextField
                  autoComplete="off"
                  label="Search recommendations"
                  labelHidden
                  value={recommendationValue}
                  suggestion={recommendationSuggestion}
                  placeholder="Search recommendations"
                  onChange={setRecommendationValue}
                  error={error.length > 0 && selectedRecommendations.size === 0 ? 'At least one recommendation must be selected' : null}
                />
              }
            >
              {recommendationListboxMarkup}
            </Combobox>
            {recommendationVerticalContentMarkup}
            {/* </Card> */}


          </Card>
        </Layout.Section>
        <p style={{ visibility: 'hidden' }}>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quos architecto cum aliquam minus at. Quasi fugiat cum at consectetur porro officiis, dolores dolorem provident illum impedit possimus magnam eligendi illo.</p>
      </Layout>

      <Modal id="my-modal">
        <div style={{ margin: '20px' }}>
          <Combobox
            allowMultiple
            activator={
              <Combobox.TextField
                autoComplete="off"
                label="Search for products"
                labelHidden
                value={value}
                suggestion={suggestion}
                onChange={setValue}
                placeholder="Search for Trigger products"
              />
            }
          >
            {/* selected={Array.from(selectedProducts.keys())}
            onSelect={updateSelection} */}
          </Combobox>
            {listboxMarkup}
            <div style={{marginTop:'10px'}}>
          <Button  onClick={() => shopify.modal.hide('my-modal')}>Add</Button>
          </div>
        </div>
          {/* {verticalContentMarkup} */}
        <TitleBar title='Choose Products'>
        </TitleBar>
      </Modal>


    </Page>
  );
}

export default MultiselectTagComboboxExample;