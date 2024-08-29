export default function addListIndex(values, listName) {
  const updatedItems = values.items.map((item, index) => ({
    ...item,
    [listName]: index + 1,
  }));
  let updatedValues = {
    ...values,
    items: updatedItems,
  };

  return updatedValues;
}
