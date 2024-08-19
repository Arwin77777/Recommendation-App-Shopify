import {
  Listbox,
  Combobox,
  Icon,
  Tag,
} from '@shopify/polaris';
import { SearchIcon } from '@shopify/polaris-icons';
import { useState, useCallback } from 'react';

function MultiAutoCombobox({ options, selectedOptions, setSelectedOptions, label,type }) {
  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);

  const updateText = useCallback(
    (value) => {
      setInputValue(value);
      if (value === '') {
        setFilteredOptions(options);
        return;
      }
      const filterRegex = new RegExp(value, 'i');
      const resultOptions = options.filter((option) => option.label.match(filterRegex));
      setFilteredOptions(resultOptions);
    },
    [options],
  );

  const updateSelection = useCallback(
    (selected) => {
      if (selectedOptions.includes(selected)) {
        setSelectedOptions(selectedOptions.filter((option) => option !== selected));
      } else {
        setSelectedOptions([...selectedOptions, selected]);
      }
      updateText('');
    },
    [selectedOptions, updateText],
  );

  const removeTag = useCallback(
    (value) => {
      setSelectedOptions(selectedOptions.filter((option) => option !== value));
    },
    [selectedOptions],
  );

  const selectedProductsMap = new Map(
    selectedOptions.map((option) => [options.find(opt => opt.value === option)?.label, option])
  );

  const optionsMarkup =
    filteredOptions.length > 0
      ? filteredOptions.map((option) => (
        <Listbox.Option
          key={`${option.value}`}
          value={option.value}
          selected={selectedOptions.includes(option.value)}
          accessibilityLabel={option.label}
        >
          {option.label}
        </Listbox.Option>
      ))
      : null;

  return (
    <div>
      <Combobox
        allowMultiple
        activator={
          <Combobox.TextField
            prefix={<Icon source={SearchIcon} />}
            onChange={updateText}
            label={label}
            labelHidden
            value={inputValue}
            placeholder="Search products"
            autoComplete="off"
          />
        }
      >
        {type==='normal' && optionsMarkup ? <Listbox onSelect={updateSelection}>{optionsMarkup}</Listbox> : null}
      </Combobox>
        {type==='modal' && optionsMarkup ? <Listbox onSelect={updateSelection}>{optionsMarkup}</Listbox> : null}
        {/* {optionsMarkup} */}
      <div style={{ margin: '10px 0px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {[...selectedProductsMap.entries()].map(([title, value]) => (
          <Tag key={value} onRemove={() => removeTag(value)}>
            {title}
          </Tag>
        ))}
      </div>
    </div>
  );
}

export default MultiAutoCombobox;
