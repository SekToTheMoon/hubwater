import axios from "../api/axios";

export const handleChangeStatus = async (status, id) => {
  let url = `/updateStatus`;
  try {
    await axios.put(url, {
      status: status,
      id: id,
    });
  } catch (error) {
    console.error("Error :", error);
  }
};
