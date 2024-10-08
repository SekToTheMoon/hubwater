import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";

function I_posit() {
  const axios = useAxiosPrivate();

  const [values, setValues] = useState({
    posit_name: "",
    dep_id: "",
    permission: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  });
  const [errors, setErrors] = useState({});
  const [selectdep, setSelectdep] = useState([]);

  const validationSchema = Yup.object({
    posit_name: Yup.string()
      .max(45, "ความยาวไม่เกิน 45 ตัวอักษร")
      .required("กรุณากรอกชื่อ แผนก"),
    dep_id: Yup.string().required("กรุณาเลือกแผนกด้วย"),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await validationSchema.validate(values, { abortEarly: false });
      // Convert permission array to string before inserting
      const valuesWithPermissionString = {
        ...values,
        permission: values.permission.join(""),
      };
      handleInsert(valuesWithPermissionString);
      setErrors({});
    } catch (error) {
      console.log(error.inner);
      const newErrors = {};
      error.inner.forEach((err) => {
        console.log(err.path);
        newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
    }
  };

  const handleInsert = async (values) => {
    try {
      const response = await axios.post("/position/insert", values);
      toast.info(response.data.msg, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    } catch (error) {
      toast.error(error.response.data.msg, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    if (name === "selectAll") {
      const updatedPermission = checked ? Array(12).fill(1) : Array(12).fill(0);
      setValues({ ...values, permission: updatedPermission });
    } else {
      const index = parseInt(name);
      const updatedPermission = [...values.permission];
      updatedPermission[index] = checked ? 1 : 0;
      setValues({ ...values, permission: updatedPermission });
    }
  };

  const fetchDep = async () => {
    try {
      const res = await axios.get("/getdep/all");
      setSelectdep(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchDep();
  }, []);

  return (
    <>
      <div className="rounded-box bg-base-100 p-8">
        <h1 className="text-2xl">เพิ่มตำแหน่ง</h1>
        <hr className="my-4" />
        <div className="flex items-center w-75">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
            <div className="flex gap-2">
              <div className="w-2/12">
                <label htmlFor="dep_id" className="block mb-2 font-medium">
                  แผนก
                </label>
                <select
                  id="dep_id"
                  name="dep_id"
                  className="select select-bordered w-full max-w-xs mb-1"
                  value={values.dep_id}
                  onChange={(e) =>
                    setValues({ ...values, dep_id: e.target.value })
                  }
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                  {selectdep.map((op) => (
                    <option key={op.dep_id} value={op.dep_id}>
                      {op.dep_name}
                    </option>
                  ))}
                </select>
                {errors.dep_id && (
                  <span className="text-error">{errors.dep_id}</span>
                )}
              </div>
              <div className="w-10/12">
                <label htmlFor="posit_name" className="block mb-2 font-medium">
                  ชื่อตำแหน่ง
                </label>
                <input
                  id="posit_name"
                  type="text"
                  placeholder=""
                  name="posit_name"
                  className="input input-bordered w-full mb-1"
                  onChange={(e) =>
                    setValues({ ...values, posit_name: e.target.value })
                  }
                />
                {errors.posit_name && (
                  <span className="text-error">{errors.posit_name}</span>
                )}
              </div>
            </div>
            <span>สิทธิ์การเข้าใช้งาน</span>
            <hr />
            <div className="form-control max-w-64">
              <label className="label cursor-pointer">
                <span className="label-text">เลือกทั้งหมด</span>
                <input
                  type="checkbox"
                  className="checkbox"
                  name="selectAll"
                  onChange={handleCheckboxChange}
                />
              </label>
            </div>
            <hr />

            <div className="grid grid-cols-5 gap-x-32">
              {[
                "Dashboard",
                "พนักงานขาย",
                "ลูกค้า",
                "เอกสารขาย",
                "ขายหน้าร้าน",
                "ค่าใช้จ่าย",
                "สินค้า",
                "ค่าคงที่สินค้า",
                "บริษัทคู่ค้า",
                "แผนก",
                "ตำแหน่ง",
                "บัญชีธนาคาร",
              ].map((permission, index) => (
                <div className="form-control" key={index}>
                  <label className="label cursor-pointer">
                    <span className="label-text">{permission}</span>
                    <input
                      type="checkbox"
                      className="checkbox"
                      name={index.toString()}
                      checked={values.permission[index] === 1}
                      onChange={handleCheckboxChange}
                    />
                  </label>
                </div>
              ))}
            </div>

            <button type="submit" className="btn btn-primary w-full mt-2">
              ตกลง
            </button>
          </form>
        </div>
      </div>
      <ToastContainer position="top-right" />
    </>
  );
}

export default I_posit;
