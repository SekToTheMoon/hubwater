import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";
import moment from "moment";

function E_customer() {
  const axios = useAxiosPrivate();

  const [values, setValues] = useState({
    fname: "",
    lname: "",
    sex: "",
    bdate: new Date(),
    address: "",
    subdistrict: "",
    email: "",
    type: "",
    nid: "",
    facebook: "",
    line: "",
    le_type: "",
    le_name: "",
    le_tax: "",
    b_name: "",
    b_num: "",
    phone: [""],
    province: "",
    district: "",
    zip_code: "",
  });

  const [errors, setErrors] = useState({});
  const [selectprovince, setSelectProvince] = useState([]);
  const [selectdistrict, setSelectDistrict] = useState([]);
  const [selectsubdistrict, setSelectSubdistrict] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams();

  const validationSchema = Yup.object({
    fname: Yup.string()
      .matches(
        /^[\u0E00-\u0E7F]+$/,
        "กรอกชื่อจริงเป็นภาษาไทย และ เป็นตัวอักษรเท่านั้น"
      )
      .required("ต้องกรอกชื่อ"),
    lname: Yup.string()
      .matches(
        /^[\u0E00-\u0E7F]+$/,
        "กรอกนามสกุลเป็นภาษาไทย และ เป็นตัวอักษรเท่านั้น"
      )
      .required("ต้องกรอกชื่อ"),
    sex: Yup.string().required("กรุณาเลือกเพศ"),
    bdate: Yup.date().required("กรุณาเลือก ว/ด/ป เกิด"),
    address: Yup.string().required("กรุณากรอกที่อยู่"),
    subdistrict: Yup.string().required("กรุณาเลือกตำบล"),
    type: Yup.string().required("กรุณาเลือกประเภท"),
    province: Yup.string().required("กรุณาเลือกจังหวัด"),
    district: Yup.string().required("กรุณาเลือกอำเภอ"),
    zip_code: Yup.string().required("กรุณากรอกรหัสไปรษณีย์"),
    nid: Yup.string()
      .matches(/^\d*$/, "ต้องเป็นตัวเลขเท่านั้น")
      .test("nid", "ต้องมีเลข 13 หลัก", (val) => {
        if (val && val.length > 0) {
          return val.length === 13;
        }
        return true; // ถ้าไม่มีค่า (ความยาว 0) ให้ผ่าน validation
      }),
    le_type: Yup.string().when("type", {
      is: "นิติบุคคล",
      then: () => Yup.string().required("กรุณาเลือกประเภทบริษัท"),
    }),
    le_name: Yup.string().when("type", {
      is: "นิติบุคคล",
      then: () => Yup.string().required("กรุณากรอกชื่อบริษัท"),
    }),
    email: Yup.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
    facebook: Yup.string(),
    line: Yup.string(),
    phone: Yup.array()
      .of(
        Yup.string().test(
          "is-number-valid",
          "โปรดป้อนหมายเลขโทรศัพท์ที่ถูกต้อง",
          (value) => value === "" || /^[0-9]{9,10}$/.test(value)
        )
      )
      .notRequired(),
  }).test(
    "at-least-one-contact",
    "กรุณากรอกข้อมูลติดต่ออย่างน้อยหนึ่งช่องทาง (อีเมล, Facebook, Line, หรือเบอร์โทร)",
    function (values) {
      return (
        values.email ||
        values.facebook ||
        values.line ||
        (values.phone && values.phone.some((p) => p))
      );
    }
  );

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
      .get("/getprovince")
      .then((res) => {
        setSelectProvince(res.data);
      })
      .catch((err) => console.log(err));
  };

  const fetchDistrict = async (province) => {
    await axios
      .get(`/getdistrict/${province}`)
      .then((res) => {
        setSelectDistrict(res.data);
      })
      .catch((err) => console.log(err));
  };

  const fetchSubdistrict = async (district) => {
    await axios
      .get(`/getsubdistrict/${district}`)
      .then((res) => {
        setSelectSubdistrict(res.data);
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    axios
      .get("/getcustomer/" + id)
      .then((res) => {
        const customerData = res.data.data[0];
        console.log(res.data.zip_code[0].zip_code);
        const date = moment(customerData.customer_bdate).format("YYYY-MM-DD");
        setValues({
          fname: customerData.customer_fname,
          lname: customerData.customer_lname,
          sex: customerData.customer_sex,
          bdate: date,
          address: customerData.customer_address,
          subdistrict: customerData.subdistrict_code,
          email: customerData.customer_email || "",
          type: customerData.customer_type,
          nid: customerData.customer_nid || "",
          facebook: customerData.customer_fb || "",
          line: customerData.customer_line || "",
          le_type: customerData.le_type || "",
          le_name: customerData.le_name || "",
          le_tax: customerData.le_tax || "",
          b_name: customerData.b_name || "",
          b_num: customerData.b_num || "",
          phone: customerData.phone ? customerData.phone.split(",") : [""], // แก้ไขตรงนี้
          province: customerData.province || "",
          district: customerData.district || "",
          zip_code: res.data.zip_code[0].zip_code || "",
        });
      })
      .catch((err) => console.log(err));
    fetchProvince();
  }, []);

  useEffect(() => {
    if (values.province) {
      fetchDistrict(values.province);
    }
  }, [values.province]);

  useEffect(() => {
    if (values.district) {
      fetchSubdistrict(values.district);
    }
  }, [values.district]);
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await validationSchema.validate(values, { abortEarly: false });
      handleEdit();
      setErrors({});
      navigate("/customer");
    } catch (error) {
      console.log(error.inner);
      const newErrors = {};
      error?.inner.forEach((err) => {
        console.log(err.path);
        err.path
          ? (newErrors[err.path] = err.message)
          : (newErrors["contact"] = err.message);
      });
      setErrors(newErrors);
    }
  };

  const handleEdit = async () => {
    console.log(values);
    try {
      const response = await axios.put("/customer/edit/" + id, values);
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

  return (
    <>
      <div className="rounded-box bg-base-100 p-5">
        <h1 className="ml-16 text-2xl">แก้ไขข้อมูลลูกค้า</h1>
        <hr className="my-4" />
        <div className="flex items-center">
          <form
            onSubmit={handleSubmit}
            className="max-w-sm mx-auto 2xl:max-w-7xl"
          >
            <div className="mt-5 2xl:flex gap-x-5">
              <div className="flex-1 mb-5">
                <label htmlFor="fname" className="block mb-2  font-medium">
                  ชื่อ
                </label>
                <input
                  type="text"
                  name="fname"
                  className="input input-bordered w-full mb-1"
                  value={values.fname || ""}
                  onChange={(e) => {
                    setValues({ ...values, fname: e.target.value });
                  }}
                />
                {errors.fname && (
                  <span className="text-error">{errors.fname}</span>
                )}
              </div>
              <div className="flex-1 mb-5">
                <label htmlFor="lname" className="block mb-2  font-medium">
                  นามสกุล
                </label>
                <input
                  type="text"
                  name="lname"
                  className="input input-bordered w-full mb-1"
                  value={values.lname}
                  onChange={(e) => {
                    setValues({ ...values, lname: e.target.value });
                  }}
                />
                {errors.lname && (
                  <span className="text-error">{errors.lname}</span>
                )}
              </div>
            </div>
            <div className="mt-5 2xl:flex gap-x-5">
              <div className="flex-1 mb-5 ">
                <label htmlFor="bdate" className="block mb-2  font-medium">
                  วัน/เดือน/ปี เกิด
                </label>
                <input
                  type="date"
                  value={values.bdate}
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
                <label htmlFor="sex" className="block mb-2  font-medium">
                  เพศ
                </label>
                <select
                  className="select select-bordered w-full  mb-1"
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
            </div>
            <div className="mt-5 2xl:flex gap-x-5">
              <div className="flex-1 mb-5">
                <label htmlFor="address" className="block mb-2  font-medium">
                  ที่อยู่
                </label>
                <input
                  type="text"
                  name="address"
                  className="input input-bordered w-full mb-1"
                  value={values.address}
                  onChange={(e) =>
                    setValues({ ...values, address: e.target.value })
                  }
                />

                {errors.address && (
                  <span className="text-error">{errors.address}</span>
                )}
              </div>
              <div className="flex-1 mb-5">
                <label htmlFor="nid" className="block mb-2  font-medium">
                  เลขประจำตัวประชาชน
                </label>
                <input
                  type="nid"
                  name="nid"
                  className="input input-bordered w-full mb-1"
                  value={values.nid}
                  onChange={(e) =>
                    setValues({ ...values, nid: e.target.value })
                  }
                />
                {errors.nid && <span className="text-error">{errors.nid}</span>}
              </div>
            </div>
            <div className="mt-5 2xl:flex gap-x-5">
              <div className="flex-1 mb-5">
                <label htmlFor="จังหวัด" className="block mb-2  font-medium">
                  จังหวัด
                </label>
                <select
                  className="select select-bordered w-full  mb-1"
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
                    // fetchDistrict(selectedProvince);
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
                  className="select select-bordered w-full  mb-1"
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
                  className="select select-bordered w-full  mb-1"
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
                <label htmlFor="email" className="block mb-2  font-medium">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  className="input input-bordered w-full mb-1"
                  value={values.email}
                  onChange={(e) =>
                    setValues({ ...values, email: e.target.value })
                  }
                />

                {errors.email && (
                  <span className="text-error">{errors.email}</span>
                )}
              </div>
              <div className="flex-1 mb-5">
                <label htmlFor="phone" className="block mb-2  font-medium">
                  เบอร์โทร
                </label>
                <div className="flex">
                  <div className="w-full">
                    {Array.isArray(values.phone) &&
                      values.phone.map((data, i) => {
                        return (
                          <div key={`phone-${i}`} className="flex">
                            <input
                              type="text"
                              name={`phone-${i}`}
                              value={data}
                              onChange={(e) => handleChangePhone(e, i)}
                              className="input input-bordered w-full mb-1"
                            />
                            {i === 0 && (
                              <div
                                className="btn btn-primary w-16"
                                onClick={() => {
                                  setValues({
                                    ...values,
                                    phone: [...values.phone, ""],
                                  });
                                }}
                              >
                                เพิ่ม
                              </div>
                            )}
                            {i !== 0 && (
                              <div
                                className="mx-auto btn btn-accent w-16"
                                onClick={() => handleDelete(i)}
                              >
                                ลบ
                              </div>
                            )}
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
            <div className="mt-5 2xl:flex gap-x-5">
              <div className="flex-1 mb-5">
                <label htmlFor="line" className="block mb-2  font-medium">
                  ID LINE
                </label>
                <input
                  type="text"
                  name="line"
                  value={values.line}
                  onChange={(e) =>
                    setValues({ ...values, line: e.target.value })
                  }
                  className="input input-bordered w-full mb-1"
                />
                {errors.line && (
                  <span className="text-error">{errors.line}</span>
                )}
              </div>
              <div className="flex-1 mb-5">
                <label htmlFor="username" className="block mb-2  font-medium">
                  Facebook
                </label>
                <input
                  type="text"
                  name="username"
                  className="input input-bordered w-full mb-1"
                  value={values.facebook}
                  onChange={(e) =>
                    setValues({ ...values, facebook: e.target.value })
                  }
                />

                {errors.dep_id && (
                  <span className="text-error">{errors.dep_id}</span>
                )}
              </div>
              <div className="flex-1 mb-5">
                <label
                  htmlFor="confirm password"
                  className="block mb-2  font-medium"
                >
                  ประเภทลูกค้า
                </label>
                <select
                  className="select select-bordered w-full  mb-1"
                  value={values.type}
                  onChange={(e) =>
                    setValues({ ...values, type: e.target.value })
                  }
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                  <option value="นิติบุคคล">นิติบุคคล</option>
                  <option value="บคุคลธรรมดา">บคุคลธรรมดา</option>
                </select>
                {errors.type && (
                  <span className="text-error">{errors.type}</span>
                )}
              </div>
            </div>
            <div
              className={values.type === "นิติบุคคล" ? "" : " invisible h-0"}
            >
              <div className="mt-5 2xl:flex gap-x-5">
                {" "}
                <div className="flex-1 mb-5">
                  <label htmlFor="le_name" className="block mb-2  font-medium">
                    ชื่อบริษัท
                  </label>
                  <input
                    type="text"
                    name="le_name"
                    className="input input-bordered w-full mb-1"
                    value={values.le_name}
                    onChange={(e) =>
                      setValues({ ...values, le_name: e.target.value })
                    }
                  />

                  {errors.le_name && (
                    <span className="text-error">{errors.le_name}</span>
                  )}
                </div>
                <div className="flex-1 mb-5">
                  <label htmlFor="le_name" className="block mb-2  font-medium">
                    เลขผํู้เสียภาษี
                  </label>
                  <input
                    type="text"
                    name="le_tax"
                    className="input input-bordered w-full mb-1"
                    value={values.le_tax}
                    onChange={(e) =>
                      setValues({ ...values, le_tax: e.target.value })
                    }
                  />

                  {errors.le_tax && (
                    <span className="text-error">{errors.le_tax}</span>
                  )}
                </div>
                <div className="flex-1 mb-5">
                  <label
                    htmlFor="confirm password"
                    className="block mb-2  font-medium"
                  >
                    ประเภทบริษัท
                  </label>
                  <select
                    className="select select-bordered w-full  mb-1"
                    value={values.le_type}
                    onChange={(e) =>
                      setValues({ ...values, le_type: e.target.value })
                    }
                  >
                    <option value="" disabled>
                      เลือก
                    </option>
                    <option value="สำนักงาน">สำนักงาน</option>
                    <option value="สาขา">สาขา</option>
                  </select>
                  {errors.le_type && (
                    <span className="text-error">{errors.le_type}</span>
                  )}
                </div>
              </div>
              <div
                className={`mt-5 2xl:flex gap-x-5${
                  values.le_type === "สาขา" ? "" : " invisible h-0"
                }`}
              >
                <div className="flex-1 mb-5">
                  <label htmlFor="b_name" className="block mb-2  font-medium">
                    ชื่อสาขา
                  </label>
                  <input
                    type="text"
                    name="b_name"
                    className="input input-bordered w-full mb-1"
                    value={values.b_name}
                    onChange={(e) =>
                      setValues({ ...values, b_name: e.target.value })
                    }
                  />

                  {errors.b_name && (
                    <span className="text-error">{errors.b_name}</span>
                  )}
                </div>
                <div className="flex-1 mb-5">
                  <label htmlFor="b_name" className="block mb-2  font-medium">
                    เลขสาขา
                  </label>
                  <input
                    type="text"
                    name="b_num"
                    className="input input-bordered w-full mb-1"
                    value={values.b_num}
                    onChange={(e) =>
                      setValues({ ...values, b_num: e.target.value })
                    }
                  />
                  {errors.b_num && (
                    <span className="text-error">{errors.b_num}</span>
                  )}
                </div>
              </div>
            </div>

            {/* <div className="mt-5 2xl:flex gap-x-5"></div> */}

            <button className="btn btn-primary w-full mt-2">ตกลง</button>
          </form>
        </div>
      </div>
      <ToastContainer position="top-right" />
    </>
  );
}

export default E_customer;
