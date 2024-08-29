import { createContext, useState } from "react";

// สร้าง context สำหรับใช้ ยืนยันตัวตน มีค่าเท่ากับ obj ว่าง
const AuthContext = createContext({});

// children คือ component ที่ส่งมา
export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({});
  // ส่ง ตัวแปร auth และ setAuth ผ่าน AuthContext
  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
