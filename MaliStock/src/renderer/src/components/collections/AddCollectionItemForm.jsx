import { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import {
  getUnitOptions,
  areUnitsCompatible,
  convertPrice,
  getConversionFactor,
  isWeightUnit,
  isVolumeUnit,
  isCountUnit,
  getStandardUnit
} from '../../utils/unitUtils';

const AddCollectionItemForm = ({ onAdd, onCancel }) => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    item_id: '',
    quantity: '',
    price: '',
    unit_price: '',
    unit: ''
  });
  const [errors, setErrors] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [customUnit, setCustomUnit] = useState(false);
  const [unitOptions, setUnitOptions] = useState([]);
  const [standardUnitPrice, setStandardUnitPrice] = useState(null);

  // Fetch inventory items and initialize unit options
  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        setLoading(true);
        const items = await window.api.inventory.getAll({});
        setInventoryItems(items || []);

        // Initialize unit options
        setUnitOptions(getUnitOptions());
      } catch (error) {
        console.error('Error fetching inventory items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryItems();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // If item_id changed, update selected item and fetch price history
    if (name === 'item_id' && value) {
      const item = inventoryItems.find(item => item.id === parseInt(value));
      setSelectedItem(item);
      setCustomUnit(false); // Reset custom unit when item changes

      // Generate unit options based on the item's unit
      if (item && item.unit) {
        // Get all unit options
        const allOptions = getUnitOptions();

        // Determine the category of the item's unit
        const isWeight = isWeightUnit(item.unit);
        const isVolume = isVolumeUnit(item.unit);
        const isCount = isCountUnit(item.unit);

        // Filter options to only include compatible units
        let compatibleOptions = allOptions.filter(option => {
          if (option.value === '') return true; // Keep the empty option

          if (isWeight) {
            return isWeightUnit(option.value);
          } else if (isVolume) {
            return isVolumeUnit(option.value);
          } else if (isCount) {
            return isCountUnit(option.value);
          }

          // If we can't determine the category, allow all units
          return true;
        });

        // Put the item's unit at the top of the list
        const itemUnitOption = compatibleOptions.find(option => option.value === item.unit);

        if (itemUnitOption) {
          const filteredOptions = [
            { value: '', label: 'Select a unit' },
            { ...itemUnitOption, label: `${itemUnitOption.label} (current)` },
            ...compatibleOptions.filter(option => option.value !== '' && option.value !== item.unit)
          ];
          setUnitOptions(filteredOptions);
        } else {
          // If the item's unit is not in our predefined list, add it
          const customOption = { value: item.unit, label: `${item.unit} (current)` };
          setUnitOptions([
            { value: '', label: 'Select a unit' },
            customOption,
            ...compatibleOptions.filter(option => option.value !== '')
          ]);
        }

        // Pre-fill the unit field with the item's unit
        setFormData(prev => ({
          ...prev,
          unit: item.unit
        }));
      } else {
        // If the item doesn't have a unit, just use all options
        setUnitOptions(getUnitOptions());
      }

      // Fetch price history for this item
      const fetchPriceHistory = async () => {
        try {
          const history = await window.api.collections.getItemPriceHistory(parseInt(value));
          setPriceHistory(history || []);

          // Calculate standard unit price from price history if available
          if (history && history.length > 0) {
            // Find the most recent price for a standard unit (1kg, 1L, 1bottle, etc.)
            const standardEntry = history.find(entry =>
              entry.quantity === 1 && entry.unit && ['kg', 'l', 'bottle', 'unit'].includes(entry.unit.toLowerCase())
            );

            if (standardEntry) {
              setStandardUnitPrice({
                price: standardEntry.unit_price,
                unit: standardEntry.unit
              });
            } else {
              // If no standard unit entry found, use the most recent entry
              const mostRecent = history[0];
              setStandardUnitPrice({
                price: mostRecent.unit_price,
                unit: mostRecent.unit || item.unit
              });
            }
          } else {
            // If no price history, use the item's last price
            if (item && item.last_price) {
              setStandardUnitPrice({
                price: item.last_price,
                unit: item.unit
              });
            } else {
              setStandardUnitPrice(null);
            }
          }
        } catch (error) {
          console.error('Error fetching price history:', error);
          setPriceHistory([]);

          // Use the item's last price as fallback
          if (item && item.last_price) {
            setStandardUnitPrice({
              price: item.last_price,
              unit: item.unit
            });
          } else {
            setStandardUnitPrice(null);
          }
        }
      };

      fetchPriceHistory();

      // If the item has a last_price, pre-fill the price field
      if (item) {
        // Use the last price from the item or from price history
        let unitPrice = 0;

        if (item.last_price) {
          unitPrice = item.last_price;
        }

        // Calculate price based on quantity if quantity is set
        const quantity = formData.quantity ? parseFloat(formData.quantity) : 1;
        let suggestedPrice = 0;

        // For weight units (kg, g, etc.)
        if (isWeightUnit(item.unit)) {
          // Convert quantity to kg equivalent
          let quantityInKg = quantity;

          if (formData.unit === 'kg') {
            // Already in kg
            quantityInKg = quantity;
          } else if (formData.unit === 'g') {
            // Convert g to kg
            quantityInKg = quantity / 1000;
          } else if (formData.unit === 'mg') {
            // Convert mg to kg
            quantityInKg = quantity / 1000000;
          }

          // Calculate total price (unit price is always per kg)
          suggestedPrice = (unitPrice * quantityInKg).toFixed(2);
        }
        // For volume units (l, ml, etc.)
        else if (isVolumeUnit(item.unit)) {
          // Convert quantity to liter equivalent
          let quantityInLiter = quantity;

          if (formData.unit === 'l') {
            // Already in liter
            quantityInLiter = quantity;
          } else if (formData.unit === 'ml') {
            // Convert ml to liter
            quantityInLiter = quantity / 1000;
          }

          // Calculate total price (unit price is always per liter)
          suggestedPrice = (unitPrice * quantityInLiter).toFixed(2);
        }
        // For count units (pcs, box, etc.)
        else if (isCountUnit(item.unit)) {
          // For count units, no conversion needed
          suggestedPrice = (unitPrice * quantity).toFixed(2);
        }

        setFormData(prev => ({
          ...prev,
          price: suggestedPrice,
          unit_price: unitPrice.toFixed(2)
        }));
      }
    }

    // If unit is being changed, update the custom unit flag and recalculate prices
    if (name === 'unit') {
      try {
        console.log(`Unit changed to: ${value}`);

        // If the unit is different from the selected item's unit, it's a custom unit
        if (selectedItem && value !== selectedItem.unit) {
          setCustomUnit(true);
        } else {
          setCustomUnit(false);
        }

        // If we have a unit price and quantity, recalculate the total price
        if (formData.unit_price && formData.quantity && selectedItem) {
          const quantity = parseFloat(formData.quantity);
          const unitPrice = parseFloat(formData.unit_price);

          if (!isNaN(quantity) && !isNaN(unitPrice) && quantity > 0) {
            let calculatedPrice = 0;

            // For weight units (kg, g, etc.)
            if (isWeightUnit(selectedItem.unit)) {
              // Convert quantity to kg equivalent
              let quantityInKg = quantity;

              if (value === 'kg') {
                // Already in kg
                quantityInKg = quantity;
              } else if (value === 'g') {
                // Convert g to kg
                quantityInKg = quantity / 1000;
              } else if (value === 'mg') {
                // Convert mg to kg
                quantityInKg = quantity / 1000000;
              }

              // Calculate total price (unit price is always per kg)
              calculatedPrice = (unitPrice * quantityInKg).toFixed(2);
              console.log(`Calculating total price: ${unitPrice} per kg × ${quantityInKg} kg = ${calculatedPrice}`);
            }
            // For volume units (l, ml, etc.)
            else if (isVolumeUnit(selectedItem.unit)) {
              // Convert quantity to liter equivalent
              let quantityInLiter = quantity;

              if (value === 'l') {
                // Already in liter
                quantityInLiter = quantity;
              } else if (value === 'ml') {
                // Convert ml to liter
                quantityInLiter = quantity / 1000;
              }

              // Calculate total price (unit price is always per liter)
              calculatedPrice = (unitPrice * quantityInLiter).toFixed(2);
              console.log(`Calculating total price: ${unitPrice} per liter × ${quantityInLiter} liter = ${calculatedPrice}`);
            }
            // For count units (pcs, box, etc.)
            else if (isCountUnit(selectedItem.unit)) {
              // For count units, no conversion needed
              calculatedPrice = (unitPrice * quantity).toFixed(2);
              console.log(`Calculating total price: ${unitPrice} per ${selectedItem.unit} × ${quantity} ${selectedItem.unit} = ${calculatedPrice}`);
            }

            setFormData(prev => ({
              ...prev,
              price: calculatedPrice
            }));
          }
        }
      } catch (error) {
        console.error('Error handling unit change:', error);
        // Don't update the form data if there's an error
      }
    }
  };

  // Update price when quantity or unit changes
  useEffect(() => {
    try {
      // Only update if we have quantity, unit, and unit price
      if (formData.quantity && formData.unit && formData.unit_price && selectedItem) {
        const quantity = parseFloat(formData.quantity);
        const unitPrice = parseFloat(formData.unit_price);

        if (!isNaN(quantity) && !isNaN(unitPrice) && quantity > 0) {
          // For weight units (kg, g, etc.)
          if (isWeightUnit(selectedItem.unit)) {
            // Convert quantity to kg equivalent
            let quantityInKg = quantity;

            if (formData.unit === 'kg') {
              // Already in kg
              quantityInKg = quantity;
            } else if (formData.unit === 'g') {
              // Convert g to kg
              quantityInKg = quantity / 1000;
            } else if (formData.unit === 'mg') {
              // Convert mg to kg
              quantityInKg = quantity / 1000000;
            }

            // Calculate total price (unit price is always per kg)
            const calculatedPrice = (unitPrice * quantityInKg).toFixed(2);
            console.log(`Calculating total price: ${unitPrice} per kg × ${quantityInKg} kg = ${calculatedPrice}`);

            setFormData(prev => ({
              ...prev,
              price: calculatedPrice
            }));
          }
          // For volume units (l, ml, etc.)
          else if (isVolumeUnit(selectedItem.unit)) {
            // Convert quantity to liter equivalent
            let quantityInLiter = quantity;

            if (formData.unit === 'l') {
              // Already in liter
              quantityInLiter = quantity;
            } else if (formData.unit === 'ml') {
              // Convert ml to liter
              quantityInLiter = quantity / 1000;
            }

            // Calculate total price (unit price is always per liter)
            const calculatedPrice = (unitPrice * quantityInLiter).toFixed(2);
            console.log(`Calculating total price: ${unitPrice} per liter × ${quantityInLiter} liter = ${calculatedPrice}`);

            setFormData(prev => ({
              ...prev,
              price: calculatedPrice
            }));
          }
          // For count units (pcs, box, etc.)
          else if (isCountUnit(selectedItem.unit)) {
            // For count units, no conversion needed
            const calculatedPrice = (unitPrice * quantity).toFixed(2);
            console.log(`Calculating total price: ${unitPrice} per ${selectedItem.unit} × ${quantity} ${selectedItem.unit} = ${calculatedPrice}`);

            setFormData(prev => ({
              ...prev,
              price: calculatedPrice
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error in price update useEffect:', error);
      // Don't update the form data if there's an error
    }
  }, [formData.quantity, formData.unit, formData.unit_price, selectedItem]);

  // Update unit price when total price changes
  // Note: This is only used when the user manually changes the total price
  const updateUnitPrice = () => {
    try {
      // Calculate unit price based on total price and quantity
      if (formData.price && formData.quantity && selectedItem) {
        const price = parseFloat(formData.price);
        const quantity = parseFloat(formData.quantity);

        if (!isNaN(price) && !isNaN(quantity) && quantity > 0) {
          // For weight units (kg, g, etc.)
          if (isWeightUnit(selectedItem.unit)) {
            // Convert quantity to kg equivalent
            let quantityInKg = quantity;

            if (formData.unit === 'kg') {
              // Already in kg
              quantityInKg = quantity;
            } else if (formData.unit === 'g') {
              // Convert g to kg
              quantityInKg = quantity / 1000;
            } else if (formData.unit === 'mg') {
              // Convert mg to kg
              quantityInKg = quantity / 1000000;
            }

            // Calculate unit price (always per kg)
            const calculatedUnitPrice = (price / quantityInKg).toFixed(2);
            console.log(`Calculating unit price: ${price} / ${quantityInKg} kg = ${calculatedUnitPrice} per kg`);

            setFormData(prev => ({
              ...prev,
              unit_price: calculatedUnitPrice
            }));
          }
          // For volume units (l, ml, etc.)
          else if (isVolumeUnit(selectedItem.unit)) {
            // Convert quantity to liter equivalent
            let quantityInLiter = quantity;

            if (formData.unit === 'l') {
              // Already in liter
              quantityInLiter = quantity;
            } else if (formData.unit === 'ml') {
              // Convert ml to liter
              quantityInLiter = quantity / 1000;
            }

            // Calculate unit price (always per liter)
            const calculatedUnitPrice = (price / quantityInLiter).toFixed(2);
            console.log(`Calculating unit price: ${price} / ${quantityInLiter} liter = ${calculatedUnitPrice} per liter`);

            setFormData(prev => ({
              ...prev,
              unit_price: calculatedUnitPrice
            }));
          }
          // For count units (pcs, box, etc.)
          else if (isCountUnit(selectedItem.unit)) {
            // For count units, no conversion needed
            const calculatedUnitPrice = (price / quantity).toFixed(2);
            console.log(`Calculating unit price: ${price} / ${quantity} ${selectedItem.unit} = ${calculatedUnitPrice} per ${selectedItem.unit}`);

            setFormData(prev => ({
              ...prev,
              unit_price: calculatedUnitPrice
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error in updateUnitPrice:', error);
      // Don't update the form data if there's an error
    }
  };

  // No search filtering - use all inventory items directly

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.item_id) {
      newErrors.item_id = 'Please select an item';
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!formData.unit_price || parseFloat(formData.unit_price) <= 0) {
      newErrors.unit_price = 'Unit price must be greater than 0';
    }

    if (!formData.unit) {
      newErrors.unit = 'Unit is required';
    }

    // Check if the selected unit is compatible with the inventory item's unit
    if (selectedItem && selectedItem.unit && formData.unit) {
      const isItemUnitWeight = isWeightUnit(selectedItem.unit);
      const isItemUnitVolume = isVolumeUnit(selectedItem.unit);
      const isItemUnitCount = isCountUnit(selectedItem.unit);

      const isSelectedUnitWeight = isWeightUnit(formData.unit);
      const isSelectedUnitVolume = isVolumeUnit(formData.unit);
      const isSelectedUnitCount = isCountUnit(formData.unit);

      // Check if the units are from different categories
      if (
        (isItemUnitWeight && !isSelectedUnitWeight) ||
        (isItemUnitVolume && !isSelectedUnitVolume) ||
        (isItemUnitCount && !isSelectedUnitCount)
      ) {
        newErrors.unit = `Unit must be compatible with the inventory unit (${selectedItem.unit})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted');

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    try {
      // Prepare data for submission
      const itemData = {
        item_id: parseInt(formData.item_id),
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        unit: formData.unit,
        standard_unit: standardUnitPrice ? standardUnitPrice.unit : formData.unit,
        standard_unit_price: standardUnitPrice ? standardUnitPrice.price : parseFloat(formData.unit_price)
        // Include both the selected unit and the standard unit for proper recording
      };

      console.log('Submitting item data:', itemData);
      await onAdd(itemData);
      console.log('Item added successfully');

      // Reset form
      setFormData({
        item_id: '',
        quantity: '',
        price: '',
        unit_price: '',
        unit: ''
      });
      setSelectedItem(null);
      setPriceHistory([]);
      setShowPriceHistory(false);
    } catch (error) {
      console.error('Error adding item to collection:', error);

      // Set a generic error
      setErrors(prev => ({
        ...prev,
        general: 'Failed to add item. Please try again.'
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <h2 className="text-xl font-semibold mb-4">Add Item to Collection</h2>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
          {errors.general}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4 mb-4 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Loading inventory items...</p>
        </div>
      ) : inventoryItems.length === 0 ? (
        <div className="text-center py-4 mb-4 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No inventory items found. Please add items to your inventory first.</p>
        </div>
      ) : (
        <Select
          label="Item"
          id="item_id"
          name="item_id"
          value={formData.item_id}
          onChange={handleChange}
          options={[
            { value: '', label: `Select an item (${inventoryItems.length} available)` },
            ...inventoryItems.map(item => ({
              value: item.id.toString(),
              label: `${item.name} (${item.category_name || 'Uncategorized'})`
            }))
          ]}
          required
          error={errors.item_id}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <Input
            label="Quantity"
            id="quantity"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="0"
            required
            step="0.01"
            error={errors.quantity}
          />

          {selectedItem && (
            <div className="text-xs text-gray-500 mt-1">
              Current stock: {selectedItem.quantity} {selectedItem.unit || 'units'}
              {selectedItem.unit && selectedItem.quantity >= 1000 && selectedItem.unit === 'g' && (
                <span> ({(selectedItem.quantity / 1000).toFixed(1)} kg)</span>
              )}
              {selectedItem.unit && selectedItem.quantity >= 1000 && selectedItem.unit === 'ml' && (
                <span> ({(selectedItem.quantity / 1000).toFixed(1)} l)</span>
              )}
              {selectedItem.unit && selectedItem.quantity < 1000 && selectedItem.unit === 'kg' && (
                <span> ({selectedItem.quantity * 1000} g)</span>
              )}
              {selectedItem.unit && selectedItem.quantity < 1000 && selectedItem.unit === 'l' && (
                <span> ({selectedItem.quantity * 1000} ml)</span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <Select
            label="Unit"
            id="unit"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            options={unitOptions.length > 0 ? unitOptions : getUnitOptions()}
            required
            error={errors.unit}
          />

          {selectedItem && selectedItem.unit && (
            <div className="text-xs text-gray-500 mt-1">
              {isWeightUnit(selectedItem.unit) && (
                <span>Compatible units: weight units (kg, g, etc.)</span>
              )}
              {isVolumeUnit(selectedItem.unit) && (
                <span>Compatible units: volume units (l, ml, etc.)</span>
              )}
              {isCountUnit(selectedItem.unit) && (
                <span>Compatible units: count units (pcs, bottle, etc.)</span>
              )}
              {customUnit && (
                <div className="text-orange-500 mt-1">
                  Note: You're using a different unit than the inventory ({selectedItem.unit || 'units'})
                </div>
              )}
            </div>
          )}

          {standardUnitPrice && (
            <div className="text-xs text-blue-600 mt-1">
              Standard price: ₹{standardUnitPrice.price} per {standardUnitPrice.unit}
              {standardUnitPrice.unit !== formData.unit && formData.unit && (
                <div className="text-xs text-gray-500">
                  Converted from ₹{standardUnitPrice.price} per {standardUnitPrice.unit} to ₹{formData.unit_price} per {formData.unit}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <Input
            label="Unit Price (₹ per kg)"
            id="unit_price"
            name="unit_price"
            type="number"
            value={formData.unit_price}
            onChange={(e) => {
              handleChange(e);
              // Recalculate total price when unit price changes
              setTimeout(() => {
                if (formData.quantity) {
                  const quantity = parseFloat(formData.quantity);
                  const unitPrice = parseFloat(e.target.value);
                  if (!isNaN(quantity) && !isNaN(unitPrice)) {
                    // Calculate the quantity in the standard unit if needed
                    let quantityInStandardUnit = quantity;

                    if (selectedItem && formData.unit !== selectedItem.unit) {
                      try {
                        // Get conversion factor between the selected unit and the standard unit
                        const { factor, direction } = getConversionFactor(formData.unit, selectedItem.unit);

                        if (direction === 'multiply') {
                          // If we need to multiply to convert to standard unit (e.g., g to kg)
                          quantityInStandardUnit = quantity * factor;
                        } else if (direction === 'divide') {
                          // If we need to divide to convert to standard unit (e.g., kg to g)
                          quantityInStandardUnit = quantity / factor;
                        }
                      } catch (error) {
                        console.error('Error converting quantity:', error);
                      }
                    }

                    const newTotalPrice = (unitPrice * quantityInStandardUnit).toFixed(2);
                    setFormData(prev => ({
                      ...prev,
                      price: newTotalPrice
                    }));
                  }
                }
              }, 0);
            }}
            placeholder="0.00"
            required
            step="0.01"
            error={errors.unit_price}
          />

          {selectedItem && (
            <div className="text-xs mt-1">
              <div className="font-medium text-gray-700">
                <span>Last Unit Price: ₹{selectedItem.last_price ? selectedItem.last_price.toFixed(2) : '0.00'} per {getStandardUnit(selectedItem.unit)}</span>
              </div>

              <div className="mt-1 bg-green-100 p-2 rounded-md text-green-800 font-bold">
                <span>IMPORTANT: Unit price is ALWAYS per {getStandardUnit(selectedItem.unit)}</span>
                <span className="block font-normal mt-1">
                  The unit price stays fixed at the price per {getStandardUnit(selectedItem.unit)}, regardless of which unit you select.
                  Only the total price changes based on the quantity and unit conversion.
                </span>
              </div>

              {selectedItem.last_spent_price && (
                <div className="mt-2 text-blue-600 font-medium">
                  <span>Last Spent Price: ₹{parseFloat(selectedItem.last_spent_price).toFixed(2)}</span>
                  <span className="block text-xs font-normal">
                    This was the total amount spent last time for this item
                  </span>
                </div>
              )}

              {formData.unit !== selectedItem.unit && (
                <div className="mt-2 bg-orange-100 p-2 rounded-md text-orange-800">
                  <span className="font-medium">Using {formData.unit} instead of {selectedItem.unit}</span>
                  <span className="block text-xs mt-1">
                    The unit price remains ₹{formData.unit_price} per {getStandardUnit(selectedItem.unit)}.
                    The total price is calculated with the correct conversion from {formData.unit} to {getStandardUnit(selectedItem.unit)}.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <Input
            label="Total Price (₹)"
            id="price"
            name="price"
            type="number"
            value={formData.price}
            onChange={(e) => {
              handleChange(e);
              // Update quantity or unit price when total price changes
              setTimeout(updateUnitPrice, 0);
            }}
            placeholder="0.00"
            required
            step="0.01"
            error={errors.price}
          />

          {standardUnitPrice && formData.unit && formData.unit !== standardUnitPrice.unit && (
            <div className="text-xs text-gray-500 mt-1">
              Equivalent to {formData.quantity} {formData.unit}
            </div>
          )}
        </div>
      </div>

      {selectedItem && (
        <div className="mt-2 mb-4 p-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
          <div className="flex flex-col">
            <p className="text-sm mb-1">
              <strong>Selected Item:</strong> {selectedItem.name}
            </p>
            <p className="text-sm mb-1">
              <strong>Category:</strong> {selectedItem.category_name || 'Uncategorized'}
            </p>

            <div className="flex justify-between items-center mt-2">
              <p className="text-sm font-medium">Price History</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowPriceHistory(!showPriceHistory)}
              >
                {showPriceHistory ? 'Hide History' : 'Show History'}
              </Button>
            </div>

            {showPriceHistory && priceHistory.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto bg-white rounded p-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-1">Date</th>
                      <th className="text-right p-1">Unit Price</th>
                      <th className="text-right p-1">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceHistory.map((entry, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="p-1">
                          {new Date(entry.recorded_at).toLocaleDateString()}
                        </td>
                        <td className="text-right p-1">₹{entry.unit_price.toFixed(2)}</td>
                        <td className="text-right p-1">
                          {entry.quantity} {selectedItem.unit || 'units'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {showPriceHistory && priceHistory.length === 0 && (
              <p className="text-sm mt-1 italic">No price history available</p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end mt-6 space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          Add Item
        </Button>
      </div>
    </form>
  );
};

export default AddCollectionItemForm;
