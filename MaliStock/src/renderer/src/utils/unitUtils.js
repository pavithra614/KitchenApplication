/**
 * Utility functions and constants for handling units
 */

// Common units for weight
export const WEIGHT_UNITS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'mg', label: 'Milligram (mg)' },
  { value: 'lb', label: 'Pound (lb)' },
  { value: 'oz', label: 'Ounce (oz)' }
];

// Common units for volume
export const VOLUME_UNITS = [
  { value: 'l', label: 'Liter (l)' },
  { value: 'ml', label: 'Milliliter (ml)' },
  { value: 'gal', label: 'Gallon (gal)' },
  { value: 'qt', label: 'Quart (qt)' },
  { value: 'pt', label: 'Pint (pt)' },
  { value: 'fl oz', label: 'Fluid Ounce (fl oz)' }
];

// Common units for count/quantity
export const COUNT_UNITS = [
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'can', label: 'Can' },
  { value: 'bag', label: 'Bag' },
  { value: 'jar', label: 'Jar' },
  { value: 'unit', label: 'Unit' }
];

// All units combined
export const ALL_UNITS = [
  ...WEIGHT_UNITS,
  ...VOLUME_UNITS,
  ...COUNT_UNITS
];

/**
 * Get unit options grouped by category
 * @returns {Array} Array of unit options with group headers
 */
export const getGroupedUnitOptions = () => {
  return [
    { value: '', label: 'Select a unit', disabled: true },
    { value: 'weight_header', label: '--- Weight ---', disabled: true },
    ...WEIGHT_UNITS,
    { value: 'volume_header', label: '--- Volume ---', disabled: true },
    ...VOLUME_UNITS,
    { value: 'count_header', label: '--- Count ---', disabled: true },
    ...COUNT_UNITS
  ];
};

/**
 * Get unit options as a flat list
 * @returns {Array} Array of unit options
 */
export const getUnitOptions = () => {
  return [
    { value: '', label: 'Select a unit' },
    ...ALL_UNITS
  ];
};

/**
 * Get the label for a unit value
 * @param {string} unitValue - The unit value
 * @returns {string} The unit label
 */
export const getUnitLabel = (unitValue) => {
  const unit = ALL_UNITS.find(u => u.value === unitValue);
  return unit ? unit.label : unitValue;
};

/**
 * Get the standard unit for a given unit
 * @param {string} unit - The unit to get the standard unit for
 * @returns {string} The standard unit
 */
export const getStandardUnit = (unit) => {
  if (!unit) return 'unit';

  // For weight units, the standard unit is kg
  if (isWeightUnit(unit)) {
    return 'kg';
  }

  // For volume units, the standard unit is l
  if (isVolumeUnit(unit)) {
    return 'l';
  }

  // For count units, use the original unit
  return unit;
};

/**
 * Check if a unit is a weight unit
 * @param {string} unit - The unit to check
 * @returns {boolean} True if the unit is a weight unit
 */
export const isWeightUnit = (unit) => {
  return WEIGHT_UNITS.some(u => u.value === unit);
};

/**
 * Check if a unit is a volume unit
 * @param {string} unit - The unit to check
 * @returns {boolean} True if the unit is a volume unit
 */
export const isVolumeUnit = (unit) => {
  return VOLUME_UNITS.some(u => u.value === unit);
};

/**
 * Check if a unit is a count unit
 * @param {string} unit - The unit to check
 * @returns {boolean} True if the unit is a count unit
 */
export const isCountUnit = (unit) => {
  return COUNT_UNITS.some(u => u.value === unit);
};

/**
 * Check if two units are compatible (same category)
 * @param {string} unit1 - First unit
 * @param {string} unit2 - Second unit
 * @returns {boolean} True if the units are compatible
 */
export const areUnitsCompatible = (unit1, unit2) => {
  if (isWeightUnit(unit1) && isWeightUnit(unit2)) return true;
  if (isVolumeUnit(unit1) && isVolumeUnit(unit2)) return true;
  if (isCountUnit(unit1) && isCountUnit(unit2)) return true;
  return false;
};

/**
 * Get conversion factor between two units
 * @param {string} fromUnit - Unit to convert from
 * @param {string} toUnit - Unit to convert to
 * @returns {Object} Object with conversion factor and direction
 */
export const getConversionFactor = (fromUnit, toUnit) => {
  // Validate inputs
  if (!fromUnit || !toUnit) {
    console.warn('Invalid units provided to getConversionFactor:', { fromUnit, toUnit });
    return { factor: 1, direction: 'same' };
  }

  // Normalize units to lowercase to handle case differences
  const from = fromUnit.toLowerCase();
  const to = toUnit.toLowerCase();

  try {
    // Weight conversions
    if (from === 'kg' && to === 'g') {
      return { factor: 1000, direction: 'multiply' }; // 1kg = 1000g, when converting kg to g, multiply by 1000
    }
    if (from === 'g' && to === 'kg') {
      return { factor: 1000, direction: 'divide' }; // 1000g = 1kg, when converting g to kg, divide by 1000
    }
    if (from === 'kg' && to === 'mg') {
      return { factor: 1000000, direction: 'multiply' }; // 1kg = 1000000mg, when converting kg to mg, multiply by 1000000
    }
    if (from === 'mg' && to === 'kg') {
      return { factor: 1000000, direction: 'divide' }; // 1000000mg = 1kg, when converting mg to kg, divide by 1000000
    }
    if (from === 'g' && to === 'mg') {
      return { factor: 1000, direction: 'multiply' }; // 1g = 1000mg, when converting g to mg, multiply by 1000
    }
    if (from === 'mg' && to === 'g') {
      return { factor: 1000, direction: 'divide' }; // 1000mg = 1g, when converting mg to g, divide by 1000
    }

    // Volume conversions
    if (from === 'l' && to === 'ml') {
      return { factor: 1000, direction: 'multiply' }; // 1l = 1000ml, when converting l to ml, multiply by 1000
    }
    if (from === 'ml' && to === 'l') {
      return { factor: 1000, direction: 'divide' }; // 1000ml = 1l, when converting ml to l, divide by 1000
    }

    // Imperial/Metric conversions
    if (from === 'kg' && to === 'lb') {
      return { factor: 2.20462, direction: 'multiply' }; // 1kg = 2.20462lb, when converting kg to lb, multiply by 2.20462
    }
    if (from === 'lb' && to === 'kg') {
      return { factor: 2.20462, direction: 'divide' }; // 2.20462lb = 1kg, when converting lb to kg, divide by 2.20462
    }
    if (from === 'g' && to === 'oz') {
      return { factor: 28.3495, direction: 'divide' }; // 28.3495g = 1oz, when converting g to oz, divide by 28.3495
    }
    if (from === 'oz' && to === 'g') {
      return { factor: 28.3495, direction: 'multiply' }; // 1oz = 28.3495g, when converting oz to g, multiply by 28.3495
    }
    if (from === 'l' && to === 'gal') {
      return { factor: 3.78541, direction: 'divide' }; // 3.78541l = 1gal, when converting l to gal, divide by 3.78541
    }
    if (from === 'gal' && to === 'l') {
      return { factor: 3.78541, direction: 'multiply' }; // 1gal = 3.78541l, when converting gal to l, multiply by 3.78541
    }

    // No conversion needed or unsupported conversion
    console.log(`No specific conversion rule for ${fromUnit} to ${toUnit}, using default factor`);
    return { factor: 1, direction: 'same' };
  } catch (error) {
    console.error('Error in getConversionFactor:', error);
    return { factor: 1, direction: 'same' };
  }
};

/**
 * Convert price between units
 * @param {number} price - Price in the original unit
 * @param {string} fromUnit - Unit to convert from
 * @param {string} toUnit - Unit to convert to
 * @returns {number} Converted price
 */
export const convertPrice = (price, fromUnit, toUnit) => {
  try {
    // Validate inputs
    if (price === undefined || price === null || isNaN(parseFloat(price))) {
      console.warn('Invalid price provided to convertPrice:', price);
      return 0;
    }

    if (!fromUnit || !toUnit) {
      console.warn('Invalid units provided to convertPrice:', { fromUnit, toUnit });
      return parseFloat(price);
    }

    // Parse price to ensure it's a number
    const numericPrice = parseFloat(price);

    // If units are the same, no conversion needed
    if (fromUnit === toUnit) {
      console.log(`No conversion needed: ${numericPrice} per ${fromUnit}`);
      return numericPrice;
    }

    const { factor, direction } = getConversionFactor(fromUnit, toUnit);
    let convertedPrice;

    // When converting prices between units, the logic is reversed from quantity conversion
    // For example, if 1kg = 1000g, then price per kg = price per g * 1000
    if (direction === 'multiply') {
      // If we need to multiply to convert quantities (e.g., kg to g), we need to divide prices
      convertedPrice = numericPrice / factor;
      console.log(`Converting ${numericPrice} per ${fromUnit} to ${convertedPrice} per ${toUnit} (dividing by ${factor})`);
    } else if (direction === 'divide') {
      // If we need to divide to convert quantities (e.g., g to kg), we need to multiply prices
      convertedPrice = numericPrice * factor;
      console.log(`Converting ${numericPrice} per ${fromUnit} to ${convertedPrice} per ${toUnit} (multiplying by ${factor})`);
    } else {
      convertedPrice = numericPrice;
      console.log(`No conversion rule found for ${fromUnit} to ${toUnit}, using original price: ${numericPrice}`);
    }

    return convertedPrice;
  } catch (error) {
    console.error('Error in convertPrice:', error);
    // Return the original price as a fallback
    return parseFloat(price) || 0;
  }
};
