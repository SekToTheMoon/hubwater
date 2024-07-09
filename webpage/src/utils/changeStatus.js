import axios from "axios";

export const handleChangeStatus = async (status, id) => {
  let url = `http://localhost:3001/updateStatus`;
  try {
    await axios.put(url, {
      status: status,
      id: id,
    });
  } catch (error) {
    console.error("Error :", error);
  }
};
