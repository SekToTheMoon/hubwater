import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";

function I_emp() {
  const [image, setImage] = useState(null);
  const [values, setValues] = useState({
    dep: "",
    position: "",
    hiredate: new Date(),
    fname: "",
    lname: "",
    sex: "",
    bdate: new Date(),
    nid: "",
    address: "",
    province: "",
    salary: "",
    commit: "",
    email: "",
    line: "",
    username: "",
    password: "",
    confirmation: "",
    phone: [""],
  });
  const [errors, setErrors] = useState({});
  const [selectprovince, setSelectProvince] = useState([]);
  const [selectdistrict, setSelectDistrict] = useState([]);
  const [selectsubdistrict, setSelectSubdistrict] = useState([]);
  const validationSchema = Yup.object({});

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handlePhoneChange = (e, i) => {
    const phoneData = [...values.phone];
    phoneData[i] = e.target.value;
    setValues({ ...values, phone: phoneData });
  };

  const handleAddPhone = () => {
    setValues({ ...values, phone: [...values.phone, ""] });
  };

  const handleDeletePhone = (i) => {
    const phoneData = [...values.phone];
    phoneData.splice(i, 1);
    setValues({ ...values, phone: phoneData });
  };

  const fetchProvince = async () => {
    await axios
      .get("http://localhost:3001/getprovince")
      .then((res) => {
        setSelectProvince(res.data);
        console.log(selectprovince);
      })
      .catch((err) => console.log(err));
  };
  const fetchDistrict = async (province) => {
    await axios
      .get(`http://localhost:3001/getdistrict/${province}`)
      .then((res) => {
        setSelectDistrict(res.data);
        console.log(selectdistrict);
      })
      .catch((err) => console.log(err));
  };
  const fetchSubdistrict = async (district) => {
    await axios
      .get(`http://localhost:3001/getsubdistrict/${district}`)
      .then((res) => {
        setSelectSubdistrict(res.data);
        console.log(selectsubdistrict);
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchProvince();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await validationSchema.validate(values, { abortEarly: false });
      await handleInsert();
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

  const handleInsert = async () => {
    const formData = new FormData();
    formData.append("dep", values.dep);
    formData.append("position", values.position);
    formData.append("hiredate", values.hiredate);
    formData.append("fname", values.fname);
    formData.append("lname", values.lname);
    formData.append("sex", values.sex);
    formData.append("bdate", values.bdate);
    formData.append("nid", values.nid);
    formData.append("address", values.address);
    formData.append("province", values.province);
    formData.append("salary", values.salary);
    formData.append("commit", values.commit);
    formData.append("email", values.email);
    formData.append("line", values.line);
    formData.append("username", values.username);
    formData.append("password", values.password);
    formData.append("confirmation", values.confirmation);
    values.phone.forEach((phone) => {
      formData.append("phone", phone);
    });
    if (image) {
      formData.append("img", image);
    }

    try {
      const response = await axios.post(
        "http://localhost:3001/employee/insert",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log("Success:", response.data);
      toast.success("Employee inserted successfully", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    } catch (error) {
      console.error("Error during employee insertion:", error);
      toast.error("Error during employee insertion", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };
  return (
    <>
      <div className="rounded-box bg-base-100 p-5">
        <h1 className="ml-16 text-2xl">เพิ่มข้อมูลพนักงาน</h1>
        <hr className="my-4" />
        <div className="flex items-center ">
          <form
            onSubmit={handleSubmit}
            className="max-w-sm mx-auto 2xl:max-w-7xl"
          >
            <div className="mt-5 2xl:flex gap-x-5">
              <div className="flex-1 mb-5 ">
                <label
                  htmlFor="dep"
                  className="block mb-2 text-sm font-medium  "
                >
                  แผนก
                </label>
                <select
                  className="select select-bordered w-full"
                  name="dep"
                  value={values.dep}
                  onChange={(e) =>
                    setValues({ ...values, dep: e.target.value })
                  }
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                </select>
              </div>
              <div className="flex-1 mb-5">
                <label
                  htmlFor="position"
                  className="block mb-2 text-sm font-medium  "
                >
                  ตำแหน่ง
                </label>
                <select
                  className="select select-bordered w-full"
                  name="position"
                  value={values.position}
                  onChange={(e) =>
                    setValues({ ...values, position: e.target.value })
                  }
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                </select>
              </div>
              <div className=" flex-1 mb-5">
                <label
                  htmlFor="hiredate"
                  className="block mb-2 text-sm font-medium  "
                >
                  วันเริ่มทำงาน
                </label>
                <input
                  type="date"
                  selected={values.hiredate}
                  onChange={(e) => {
                    setValues({ ...values, hiredate: e.target.value }); // ใช้ e.target.value แทน e.target.Date
                  }}
                  dateformat="yyyy-MM-dd"
                  className="input input-bordered w-full mb-1"
                />
              </div>
            </div>
            <div className="mt-5 2xl:flex gap-x-5">
              <div className="flex-1 mb-5">
                <label
                  htmlFor="fname"
                  className="block mb-2 text-sm font-medium  "
                >
                  ชื่อ
                </label>
                <input
                  type="text"
                  name="fname"
                  className="input input-bordered w-full "
                  placeholder="ชื่อจริง"
                />
              </div>
              <div className=" flex-1 mb-5">
                <label
                  htmlFor="lname"
                  className="block mb-2 text-sm font-medium "
                >
                  นามสกุล
                </label>
                <input
                  type="text"
                  name="lname"
                  className="input input-bordered w-full "
                  placeholder="นามสกุลจริง"
                />
              </div>
            </div>
            <div className="mt-5 2xl:flex gap-x-5">
              <div className="flex-none mb-5 2xl:w-1/6">
                <label
                  htmlFor="sex"
                  className="block mb-2 text-sm font-medium  "
                >
                  เพศ
                </label>
                <select
                  className="select select-bordered w-full"
                  name="sex"
                  value={values.sex}
                  onChange={(e) =>
                    setValues({ ...values, sex: e.target.value })
                  }
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                  <option value="ชาย">ชาย</option>
                  <option value="หญิง">หญิง</option>
                </select>
              </div>
              <div className="flex-1 mb-5">
                <label
                  htmlFor="bdate"
                  className="block mb-2 text-sm font-medium  "
                >
                  วัน/เดือน/ปี เกิด
                </label>
                <input
                  type="date"
                  selected={values.bdate}
                  onChange={(e) => {
                    setValues({ ...values, bdate: e.target.value });
                  }}
                  dateformat="yyyy-MM-dd"
                  className="input input-bordered w-full mb-1"
                />
              </div>
              <div className="flex-1 mb-5">
                <label
                  htmlFor="nid"
                  className="block mb-2 text-sm font-medium  "
                >
                  เลขประจำตัวประชาชน
                </label>
                <input
                  type="nid"
                  name="nid"
                  className="input input-bordered w-full "
                  placeholder="รหัส 12 หลัก"
                />
              </div>
            </div>
            <div className="mb-5">
              <label
                htmlFor="address"
                className="block mb-2 text-sm font-medium  "
              >
                ที่อยู่ปัจจุบัน
              </label>
              <input
                type="text"
                name="address"
                className="input input-bordered w-full "
                placeholder="บ้านเลขที่ หมู่ ซอย ถนน"
              />
            </div>
            <div className="mt-5 2xl:flex gap-x-5">
              <div className="flex-1 mb-5">
                <label htmlFor="จังหวัด" className="block mb-2  font-medium">
                  จังหวัด
                </label>
                <select
                  className="select select-bordered w-full max-w-xs mb-1"
                  value={values.province}
                  onChange={(e) => {
                    const selectedProvince = e.target.value;
                    setValues({
                      ...values,
                      province: selectedProvince,
                      district: "",
                      subdistrict: "",
                      zip_code: "",
                    });
                    fetchDistrict(selectedProvince);
                  }}
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                  {selectprovince.map((op) => (
                    <option key={op.code} value={op.code}>
                      {op.name}
                    </option>
                  ))}
                </select>

                {errors.province && (
                  <span className="text-error">{errors.province}</span>
                )}
              </div>
              <div className="flex-1 mb-5">
                <label htmlFor="district" className="block mb-2  font-medium">
                  อำเภอ
                </label>
                <select
                  className="select select-bordered w-full max-w-xs mb-1"
                  value={values.district}
                  onChange={(e) => {
                    const selectedDistrict = e.target.value;
                    setValues({
                      ...values,
                      district: selectedDistrict,
                      subdistrict: "",
                      zip_code: "",
                    });
                    fetchSubdistrict(selectedDistrict);
                  }}
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                  {selectdistrict.map((op) => (
                    <option key={op.code} value={op.code}>
                      {op.name}
                    </option>
                  ))}
                </select>

                {errors.district && (
                  <span className="text-error">{errors.district}</span>
                )}
              </div>
              <div className="flex-1 mb-5">
                <label
                  htmlFor="subdistrict"
                  className="block mb-2  font-medium"
                >
                  ตำบล
                </label>
                <select
                  className="select select-bordered w-full max-w-xs mb-1"
                  value={values.subdistrict}
                  onChange={(e) => {
                    console.log(e.target.value.split(",")[1]);
                    setValues({
                      ...values,
                      subdistrict: e.target.value.split(",")[0],
                      zip_code: e.target.value.split(",")[1],
                    });
                  }}
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                  {selectsubdistrict.map((op) => (
                    <option key={op.code} value={[op.code, op.zip_code]}>
                      {op.name}
                    </option>
                  ))}
                </select>

                {errors.subdistrict && (
                  <span className="text-error">{errors.subdistrict}</span>
                )}
              </div>
              <div className="flex-1 mb-5">
                <label htmlFor="username" className="block mb-2  font-medium">
                  รหัสไปรษณีย์
                </label>
                <input
                  type="text"
                  name="zip_code"
                  className="input input-bordered w-full mb-1"
                  readOnly
                  value={values.zip_code}
                />
                {errors.zip_code && (
                  <span className="text-error">{errors.zip_code}</span>
                )}
              </div>
            </div>

            <div className="mt-5 2xl:flex gap-x-5">
              <div className="flex-1 mb-5">
                <label
                  htmlFor="salary"
                  className="block mb-2 text-sm font-medium  "
                >
                  เงินเดือน
                </label>
                <input
                  type="text"
                  name="salary"
                  className="input input-bordered w-full "
                  placeholder="เงินเดือน"
                />
              </div>
              <div className="flex-1 mb-5">
                <label
                  htmlFor="fname"
                  className="block mb-2 text-sm font-medium  "
                >
                  ค่าคอมมิชชั่น
                </label>
                <input
                  type="text"
                  name="commit"
                  className="input input-bordered w-full "
                  placeholder="เปอร์เซ็นต์"
                />
              </div>
            </div>
            <div className="mt-5 2xl:flex gap-x-5">
              <div className="flex-1 mb-5">
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium  "
                >
                  อีเมล
                </label>
                <input
                  type="email"
                  name="email"
                  className="input input-bordered w-full "
                  placeholder="ชืออีเมล@gemail.com"
                />
              </div>
              <div className="flex-1 mb-5">
                <label
                  htmlFor="line"
                  className="block mb-2 text-sm font-medium  "
                >
                  ID LINE
                </label>
                <input
                  type="text"
                  name="line"
                  className="input input-bordered w-full "
                />
              </div>
            </div>
            <div className="mt-5 2xl:flex gap-x-5">
              <div className=" flex-1 mb-5">
                <label
                  htmlFor="img"
                  className="block mb-2 text-sm font-medium  "
                >
                  รูป
                </label>
                <input
                  type="file"
                  name="img"
                  accept="image/*"
                  className="file-input file-input-bordered w-full "
                  onChange={handleFileChange}
                />
                {values.imageURL && (
                  <div className="w-100 flex justify-center h-40 bg-base-200">
                    <img
                      className="w-100"
                      src={values.imageURL}
                      alt="uploaded"
                    />
                  </div>
                )}
              </div>
              <div className="flex-1 mb-5">
                <label htmlFor="phone" className="block mb-2  font-medium">
                  เบอร์โทร
                </label>
                <div className="flex">
                  <div className="w-full">
                    {values.phone.map((data, i) => {
                      return (
                        <div key={`phone[${i}]`} className="w-full">
                          <div className="flex">
                            <input
                              type="text"
                              name={`phone[${i}]`}
                              value={data}
                              onChange={(e) => handleChangePhone(e, i)}
                              className=" input input-bordered w-full mb-1"
                            />
                            {i == 0 && (
                              <div
                                className="btn btn-primary w-16"
                                onClick={() => {
                                  setValues(() => ({
                                    ...values,
                                    phone: [...values.phone, ""],
                                  }));
                                }}
                              >
                                เพิ่ม
                              </div>
                            )}
                            {i !== 0 && (
                              <div
                                className="mx-auto btn btn-accent  w-16"
                                onClick={() => handleDelete(i)}
                              >
                                ลบ
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <hr />
            <div className="mt-5 2xl:flex gap-x-5">
              <div className=" flex-1 mb-5">
                <label
                  htmlFor="username"
                  className="block mb-2 text-sm font-medium  "
                >
                  ชื่อบัญชี
                </label>
                <input
                  type="text"
                  name="username"
                  className="input input-bordered w-full "
                  placeholder="Username"
                />
              </div>
              <div className="flex-1 mb-5">
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-medium  "
                >
                  Your password
                </label>
                <input
                  type="password"
                  name="password"
                  className="input input-bordered w-full "
                  placeholder="Password"
                />
              </div>
              <div className="flex-1 mb-5">
                <label
                  htmlFor="confirm password"
                  className="block mb-2 text-sm font-medium  "
                >
                  Confirm password
                </label>
                <input
                  type="password"
                  name="confirmation"
                  className="input input-bordered w-full "
                  placeholder="Confirm Password"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full mb-5">
              ตกลง
            </button>
          </form>
        </div>
      </div>
      <ToastContainer position="top-right" />
    </>
  );
}

export default I_emp;
