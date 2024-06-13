import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";

function I_emp() {
  const [values, setValues] = useState({
    fname: "",
    lname: "",
    bdate: "",
    hiredate: "",
    sex: "",
    salary: Number(),
    username: "",
    password: "",
    confirmation: "",
    nid: "",
    address: "",
    email: "",
    line: "",
    commit: Number(0),
    phone: [""],
    dep: "",
    position: "",
    province: "",
    district: "",
    subdistrict: "",
    zip_code: "",
    images: null,
  });
  const [errors, setErrors] = useState({});
  const [selectprovince, setSelectProvince] = useState([]);
  const [selectdistrict, setSelectDistrict] = useState([]);
  const [selectsubdistrict, setSelectSubdistrict] = useState([]);
  const [selectdep, setSelectdep] = useState([]);
  const [selectposit, setSelectposit] = useState([]);
  const [imageURL, setImageURL] = useState(null);
  const validationSchema = Yup.object({
    fname: Yup.string()
      .matches(/^[\u0E00-\u0E7F]+$/, "กรอกชื่อจริงไม่ถูกต้อง")
      .required("ต้องกรอกชื่อ"),
    lname: Yup.string()
      .matches(/^[\u0E00-\u0E7F]+$/, "กรอกนามสกุลไม่ถูกต้อง")
      .required("ต้องกรอกนามสกุล"),

    password: Yup.string()
      .min(6, "กรอกรหัสผ่านไม่น้อยกว่า 6 หลัก")
      // .matches(/[!@#$%^&*(),.?":{}|<>]/,"รหัสผ่านต้องมีอักษรพิเศษอย่างน้อย 1 ตัว")
      // .matches(/[0-9]/,"รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว")
      // .matches(/A-Z]/,"รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว")
      // .matches(/a-z]/,"รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว")
      .required("ต้องกรอกรหัสผ่าน"),

    confirmation: Yup.string()
      .oneOf([Yup.ref("password"), null], "รหัสไม่ตรงกัน")
      .required("ต้องกรอกยืนยันรหัสผ่าน"),
    bdate: Yup.string().required("ต้องเลือกวันเกิดของพนักงาน"),
    sex: Yup.string().required("ต้องเลือกเพศของพนักงาน"),
    salary: Yup.number()
      .required("ต้องกรอกเงินเดือนของพนักงาน")
      .positive("กรอกเงินเดือนไม่ถูกต้อง")
      .integer("เงินเดือนต้องเป็นจำนวนเต็มบวก"),
    hiredate: Yup.string().required("ต้องเลือกวันเริ่มทำงานของพนักงาน"),
    username: Yup.string().required("ต้องกรอกชื่อบัญชี"),
    images: Yup.string().required("ต้องเลือกรูปภาพ"),
    nid: Yup.string()
      .required("ต้องกรอกเลขประจำตัวประชาชน")
      .matches(/^\d+$/, "ต้องเป็นตัวเลขเท่านั้น")
      .length(13, "ต้องมีเลข 13 หลัก"),
    phone: Yup.array()
      .of(
        Yup.string().test(
          "is-number-valid",
          "โปรดป้อนหมายเลขโทรศัพท์ที่ถูกต้อง",
          (value) => value === "" || /^[0-9]{10}$/.test(value)
        )
      )
      .notRequired(),
    address: Yup.string().required("ต้องกรอกที่อยู่"),
    commit: Yup.number()
      .required("ต้องกรอกค่าคอมมิสชั่น")
      .min(0, "ค่าคอมมิสชั่นต้องมากกว่าหรือเท่ากับ 0")
      .integer("ค่าคอมมิสชั่นต้องเป็นจำนวนเต็มเท่านั้น"),
    position: Yup.string().required("ต้องเลือกตำแหน่งงาน"),
    province: Yup.string().required("ต้องเลือกจังหวัด"),
    dep: Yup.string().required("ต้องเลือกแผนก"),
    subdistrict: Yup.string().required("ต้องเลือกตำบล"),
    district: Yup.string().required("ต้องเลือกอำเภอ"),
    zip_code: Yup.string().required("ต้องเลือกรหัสไปรษณีย์"),
  });

  //จัดการไฟล์รูปภาพ
  const handleFileChange = (e) => {
    if (e.target.files.length === 1) {
      setValues({ ...values, images: e.target.files[0] });
    } else {
      toast.error("เลือกรูปได้เพียง 1 รูป", {
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

  const handleChangePhone = (e, i) => {
    const inputdata = [...values.phone];
    inputdata[i] = e.target.value;
    setValues({ ...values, phone: inputdata });
  };
  const handleDelete = (i) => {
    const deletVal = [...values.phone];
    deletVal.splice(i, 1);
    setValues({ ...values, phone: deletVal });
  };

  const fetchProvince = async () => {
    await axios
      .get("http://localhost:3001/getprovince")
      .then((res) => {
        setSelectProvince(res.data);
      })
      .catch((err) => console.log(err));
  };
  const fetchDistrict = async (province) => {
    await axios
      .get(`http://localhost:3001/getdistrict/${province}`)
      .then((res) => {
        setSelectDistrict(res.data);
      })
      .catch((err) => console.log(err));
  };
  const fetchSubdistrict = async (district) => {
    await axios
      .get(`http://localhost:3001/getsubdistrict/${district}`)
      .then((res) => {
        setSelectSubdistrict(res.data);
      })
      .catch((err) => console.log(err));
  };
  const fetchDep = async () => {
    await axios
      .get("http://localhost:3001/getdep/all")
      .then((res) => {
        setSelectdep(res.data);
      })
      .catch((err) => console.log(err));
  };
  const fetchPosit = async (dep) => {
    await axios
      .get(`http://localhost:3001/getempselectposit/${dep}`)
      .then((res) => {
        setSelectposit(res.data);
      })
      .catch((err) => console.log(err));
  };
  useEffect(() => {
    fetchProvince();
    fetchDep();
  }, []);
  useEffect(() => {
    if (values.images == null) return;
    console.log(typeof values.images);
    const newImageURL = URL.createObjectURL(values.images);
    setImageURL(newImageURL);
    console.log(values.images);

    return () => {
      // Cleanup เมื่อ Component ถูก unmount
      URL.revokeObjectURL(newImageURL);
    };
  }, [values.images]);

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
        // console.log(err.path);
        newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
      console.log(errors);
    }
  };

  const handleInsert = async () => {
    const formData = new FormData();
    formData.append("position", values.position);
    formData.append("hiredate", values.hiredate);
    formData.append("fname", values.fname);
    formData.append("lname", values.lname);
    formData.append("sex", values.sex);
    formData.append("bdate", values.bdate);
    formData.append("nid", values.nid);
    formData.append("address", values.address);
    formData.append("salary", values.salary);
    formData.append("commit", values.commit);
    formData.append("email", values.email);
    formData.append("line", values.line);
    formData.append("username", values.username);
    formData.append("password", values.password);
    formData.append("img", values.images);
    formData.append("subdistrict", values.subdistrict);
    values.phone.forEach((phone) => {
      formData.append("phone", phone);
    });
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
                  value={values.dep}
                  onChange={(e) => {
                    const selectedDep = e.target.value;
                    setValues({ ...values, dep: selectedDep, position: "" });
                    fetchPosit(selectedDep);
                  }}
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
                {errors.dep && <span className="text-error">{errors.dep}</span>}
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
                  onChange={(e) => {
                    setValues({ ...values, position: e.target.value });
                  }}
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                  {selectposit.map((op) => (
                    <option key={op.posit_id} value={op.posit_id}>
                      {op.posit_name}
                    </option>
                  ))}
                </select>
                {errors.position && (
                  <span className="text-error">{errors.position}</span>
                )}
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
                {errors.hiredate && (
                  <span className="text-error">{errors.hiredate}</span>
                )}
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
                  value={values.fname}
                  onChange={(e) =>
                    setValues({ ...values, fname: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="ชื่อจริง"
                />
                {errors.fname && (
                  <span className="text-error">{errors.fname}</span>
                )}
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
                  value={values.lname}
                  onChange={(e) =>
                    setValues({ ...values, lname: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="นามสกุลจริง"
                />
                {errors.lname && (
                  <span className="text-error">{errors.lname}</span>
                )}
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
                {errors.sex && <span className="text-error">{errors.sex}</span>}
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
                {errors.bdate && (
                  <span className="text-error">{errors.bdate}</span>
                )}
              </div>
              <div className="flex-1 mb-5">
                <label
                  htmlFor="nid"
                  className="block mb-2 text-sm font-medium  "
                >
                  เลขประจำตัวประชาชน
                </label>
                <input
                  type="text"
                  name="nid"
                  onChange={(e) =>
                    setValues({ ...values, nid: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="เลข 13 หลัก"
                />
                {errors.nid && <span className="text-error">{errors.nid}</span>}
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
                onChange={(e) =>
                  setValues({ ...values, address: e.target.value })
                }
                className="input input-bordered w-full"
                placeholder="บ้านเลขที่ หมู่ ซอย ถนน"
              />
              {errors.address && (
                <span className="text-error">{errors.address}</span>
              )}
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
                  onChange={(e) =>
                    setValues({ ...values, salary: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="เงินเดือน"
                />
                {errors.salary && (
                  <span className="text-error">{errors.salary}</span>
                )}
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
                  onChange={(e) =>
                    setValues({ ...values, commit: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="เปอร์เซ็นต์"
                />
                {errors.commit && (
                  <span className="text-error">{errors.commit}</span>
                )}
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
                  onChange={(e) =>
                    setValues({ ...values, email: e.target.value })
                  }
                  className="input input-bordered w-full"
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
                  onChange={(e) =>
                    setValues({ ...values, line: e.target.value })
                  }
                  className="input input-bordered w-full"
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
                  onChange={handleFileChange}
                  className="file-input file-input-bordered w-full"
                />
                {imageURL && (
                  <div className="w-100 flex justify-center h-40 bg-base-200">
                    <img className="w-100" src={imageURL} alt="uploaded" />
                  </div>
                )}
                {errors.images && (
                  <span className="text-error">{errors.images}</span>
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
                {Object.keys(errors).some((key) => key.startsWith("phone")) && (
                  <span className="text-error">รูปแบบเบอร์โทรศัพท์ผิด</span>
                )}
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
                  onChange={(e) =>
                    setValues({ ...values, username: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="Username"
                />
                {errors.username && (
                  <span className="text-error">{errors.username}</span>
                )}
              </div>
              <div className="flex-1 mb-5">
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-medium  "
                >
                  รหัสผ่าน
                </label>
                <input
                  type="password"
                  name="password"
                  onChange={(e) =>
                    setValues({ ...values, password: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="Password"
                />
                {errors.password && (
                  <span className="text-error">{errors.password}</span>
                )}
              </div>
              <div className="flex-1 mb-5">
                <label
                  htmlFor="confirm password"
                  className="block mb-2 text-sm font-medium  "
                >
                  ยืนยันรหัสผ่าน
                </label>
                <input
                  type="password"
                  name="confirmation"
                  onChange={(e) =>
                    setValues({ ...values, confirmation: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="Confirm Password"
                />
                {errors.confirmation && (
                  <span className="text-error">{errors.confirmation}</span>
                )}
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
