import axios from "../api/axios";
import useAuth from "./useAuth";
// const useRefreshToken = () => {
//   const { auth, setAuth } = useAuth();
//   const refresh = async () => {
//     const response = await axios.get(`/refresh/${auth.employee_id}`, {
//       withCredentials: true,
//     });
//     setAuth((prev) => {
//       return { ...prev, accessToken: response.data.accessToken };
//     });
//     return response.data.accessToken;
//   };
//   return refresh;
// };

// original
const useRefreshToken = () => {
  const { setAuth } = useAuth();

  // ใช้ axios ธรรมดา ยิงไป
  const refresh = async () => {
    const response = await axios.get("/refresh", {
      withCredentials: true,
    });
    const permissionArray = response.data.posit_permission.split("");
    permissionArray.splice(0, 0, "1");
    setAuth({
      employee_id: response.data.employee_id,
      employee_img: response.data.employee_img,
      employee_fname: response.data.employee_fname,
      employee_lname: response.data.employee_lname,
      posit_permission: permissionArray,
      posit_name: response.data.posit_name,
      accessToken: response.data.accessToken,
    });

    console.log(response, " from useRefreshToken auth");
    // ส่ง accessToken กับไป
    return response.data.accessToken;
  };
  return refresh;
};
export default useRefreshToken;
