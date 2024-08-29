import { useContext } from "react";
import AuthContext from "../context/authProvider";

// สร้างเพื่อ จะได้เรียกใช้ authContext ง่ายๆ โดยเรียกใช้แค่ file นี้ file เดียว
const useAuth = () => {
  return useContext(AuthContext);
};

export default useAuth;
