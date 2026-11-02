export interface AddOnDraft {
  key: string; // stable React key for rows that have no id yet
  name: string;
  price: string;
}

let counter = 0;

export const newAddOnRow = (name = "", price = ""): AddOnDraft => ({
  key: `addon-${++counter}`,
  name,
  price,
});
