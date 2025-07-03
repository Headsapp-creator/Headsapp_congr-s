export const ATTRIBUTE_META = {
  name: { name: "name", label: "Name", type: "text" },
  email: { name: "email", label: "Email", type: "email" },
  phone: { name: "phone", label: "Phone", type: "number" },
  address: { name: "address", label: "Address", type: "text" },
  country: { name: "country", label: "Country", type: "text" },
  specialty: { name: "specialty", label: "Specialty", type: "text" },
  activity: {
    name: "activity",
    label: "Activity",
    type: "select",
    options: [] 
  }, price: { name: "price", label: "Price", type: "checkbox-specialty" },
  takeover: { name: "takeover", label: "Takeover", type: "radio" },
  laboratoryName: { name: "laboratoryName", label: "Laboratory Name", type: "text" },
};