import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { Chart as ChartJS } from "chart.js/auto";
import { Pie, Bar, Line, Doughnut } from "react-chartjs-2";
import moment from "moment";

function selectTimeline(onChangeFunc) {
  return (
    <select
      className="select join-item select-bordered w-full max-w-2xl min-h-1 h-9"
      onChange={(e) => onChangeFunc(e.target.value)}
      defaultValue="year"
    >
      <option value="year">1 ปี</option>
      <option value="6month">6 เดือน</option>
      <option value="3month">3 เดือน</option>
      <option value="1month">1 เดือน</option>
    </select>
  );
}
function StackedBarChart(data) {
  const options = {
    scales: {
      x: { stacked: true },
      y: { stacked: false, beginAtZero: true },
    },
  };
  return <Bar data={data} options={options}></Bar>;
}

function Dashboard() {
  const [incomeData, setIncomeData] = useState(null);
  const [expenseData, setExpenseData] = useState(null);
  const [incomeAndExpense, setIncomeAndExpense] = useState(null);
  const [CrossTab, setCrossTab] = useState();
  const [expenseTypeData, setExpenseTypeData] = useState(null);
  const [Commition, setCommition] = useState([]);
  const [Pay, setPay] = useState();
  const [TopSale, setTopSale] = useState();

  const [categoryProduct, setCategoryProduct] = useState(null);
  const [TotalIncome, setTotalIncome] = useState(null);
  const [totalReceived, setTotalReceived] = useState(0);

  const [DateRanges, setDateRanges] = useState({
    startDate: moment().subtract(1, "years").format("YYYY-MM-DD"),
    endDate: moment(new Date()).format("YYYY-MM-DD"),
  });
  const [selectCategory, setSelectCategory] = useState("ทั้งหมด");

  const handleSubmitTopSale = (e) => {
    e.preventDefault();

    if (DateRanges.endDate > DateRanges.startDate) {
      fetchTopSale(DateRanges.startDate, DateRanges.endDate, selectCategory);
    } else {
      alert("Please select a valid date range");
    }
  };

  const fetchCategoryProduct = async () => {
    try {
      const response = await axios.get(`/getCategoryProduct`);
      setCategoryProduct(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const fetchIncome = async (timeline) => {
    try {
      const response = await axios.get(`/getIncome?timeline=${timeline}`);
      const data = response.data;
      setIncomeData({
        labels: data.labels,
        datasets: [
          {
            label: "รายได้รวม",
            data: data.totalIncomeData,
            backgroundColor: "rgba(75, 192, 192, 0.5)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
          {
            label: "เก็บเงินแล้ว",
            data: data.incomeData,
            backgroundColor: "rgba(54, 162, 235, 1)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
        ],
      });
      setTotalIncome(data.totalIncomeSum);
      setTotalReceived(data.totalReceivedSum);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const fetchExpense = async (timeline) => {
    try {
      const response = await axios.get(`/getExpense?timeline=${timeline}`);
      const data = response.data;
      setExpenseData({
        labels: data.labels,
        datasets: [
          {
            label: "ค่าใช้จ่ายรวม",
            data: data.totalExpenseData,
            backgroundColor: "rgba(255, 99, 132, 0.5)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
          {
            label: "ชำระเงินแล้ว",
            data: data.expenseData,
            backgroundColor: "rgba(255, 99, 132, 1)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
        ],
      });
      // setTotalIncome(data.totalIncomeSum);
      // setTotalReceived(data.totalReceivedSum);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const fetchIncomeAndExpense = async (timeline) => {
    try {
      const responseIncome = await axios.get(`/getIncome?timeline=${timeline}`);
      const responseExpense = await axios.get(
        `/getExpense?timeline=${timeline}`
      );
      const dataIncome = responseIncome.data;
      const dataExpense = responseExpense.data;

      setIncomeAndExpense({
        labels: dataIncome.labels,
        datasets: [
          {
            label: "รายได้รวม",
            data: dataIncome.totalIncomeData,
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
          {
            label: "ค่าใช้จ่ายรวม",
            data: dataExpense.totalExpenseData,
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            borderColor: "rgba(255, 99, 132, 1)",

            borderWidth: 1,
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const fetchSaleProduct = async (timeline) => {
    let url = `/getSaleProduct?timeline=${timeline}`;
    try {
      const response = await axios.get(url);
      const labels = response.data.map((item) => item.product_name);
      const data = response.data.map((item) =>
        parseInt(item.total_sales_amount)
      );
      setCrossTab({
        labels: labels,
        datasets: [
          {
            label: "ยอดขาย",
            data: data,
            backgroundColor: [
              "rgba(255, 99, 132, 0.8)",
              "rgba(54, 162, 235, 0.8)",
              "rgba(255, 206, 86, 0.8)",
              "rgba(75, 192, 192, 0.8)",
              "rgba(153, 102, 255, 0.8)",
              "rgba(255, 159, 64, 0.8)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)",
            ],
            borderWidth: 1,
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching sales data:", error);
    }
  };
  const fetchExpenseByCategory = async (timeline) => {
    let url = `/getExpenseByCategory?timeline=${timeline}`;
    try {
      const response = await axios.get(url);
      const labels = response.data.map((item) => item.expensetype_name);
      const data = response.data.map((item) =>
        parseInt(item.total_expense_amount)
      );
      setExpenseTypeData({
        labels: labels,
        datasets: [
          {
            label: "ยอดชำระ",
            data: data,
            backgroundColor: [
              "rgba(255, 99, 132, 0.8)",
              "rgba(54, 162, 235, 0.8)",
              "rgba(255, 206, 86, 0.8)",
              "rgba(75, 192, 192, 0.8)",
              "rgba(153, 102, 255, 0.8)",
              "rgba(255, 159, 64, 0.8)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)",
            ],
            borderWidth: 1,
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching sales data:", error);
    }
  };
  const fetchCommition = async (timeline) => {
    let url = `/getCommition?timeline=${timeline}`;
    try {
      const response = await axios.get(url);

      setCommition(response.data);
    } catch (error) {
      console.error("Error fetching sales data:", error);
    }
  };
  const fetchTopSale = async (startDate, endDate, category) => {
    try {
      const response = await axios.get(
        `/getTopSale?startDate=${startDate}&&endDate=${endDate}&&category=${category}`
      );
      const data = response.data;
      setTopSale(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchIncome("year");
    fetchExpense("year");
    fetchSaleProduct("year");
    fetchIncomeAndExpense("year");
    fetchExpenseByCategory("year");
    fetchCommition("year");
    fetchTopSale(DateRanges.startDate, DateRanges.endDate, selectCategory);
    fetchCategoryProduct();
  }, []);

  return (
    <>
      <h1 className="text-3xl mb-5 text-neutral-content">ภาพรวมบริษัท</h1>
      <main className="grid grid-cols-3  gap-4">
        <div className="rounded-lg bg-base-100 p-5  shadow-xl">
          <h2 className="card-title my-2">ยอดขายตามสินค้า</h2>
          {selectTimeline(fetchSaleProduct)}
          <figure className="h-full mt-3 ">
            {CrossTab && <Doughnut data={CrossTab} />}
          </figure>
        </div>
        <div className="col-span-2 bg-base-100 shadow-xl p-5 rounded-lg">
          <h2 className="card-title my-2">สรุปยอดเก็บเงิน</h2>
          {selectTimeline(fetchIncome)}
          <figure className="h-full mt-3 ">
            {incomeData && StackedBarChart(incomeData)}
          </figure>
        </div>
        <div className=" rounded-lg bg-base-100 p-5  shadow-xl">
          <h2 className="card-title my-2">ค่าใช้จ่ายตามหมวดหมู่</h2>

          {selectTimeline(fetchExpenseByCategory)}

          <figure className="h-full mt-3">
            {expenseTypeData && <Doughnut data={expenseTypeData} />}
          </figure>
        </div>
        <div className="col-span-2 bg-base-100 shadow-xl p-5 rounded-lg">
          <h2 className="card-title my-2">สรุปยอดชำระเงิน</h2>
          {selectTimeline(fetchExpense)}
          <figure className="h-full mt-3 ">
            {expenseData && StackedBarChart(expenseData)}
          </figure>
        </div>
        <div className="col-span-3 bg-base-100 shadow-xl p-5 rounded-lg">
          <h2 className="card-title my-2">รายได้และค่าใช้จ่ายตามเอกสาร</h2>
          {selectTimeline(fetchIncomeAndExpense)}
          <figure className="h-full mt-3 ">
            {incomeAndExpense && (
              <Line data={incomeAndExpense} options={{ fill: true }} />
            )}
          </figure>
        </div>

        <div className="col-span-3 bg-base-100 shadow-xl p-5 rounded-lg">
          <h2 className="card-title my-2">รายงานสินค้าขายดี</h2>

          <figure className="h-full mt-3 ">
            <form onSubmit={handleSubmitTopSale}>
              <div className="flex justify-between gap-2">
                <div className=" mb-4 ">
                  <label className="col-sm-2 col-form-label">เริ่มต้น</label>
                  <div className="col-sm-5">
                    <input
                      type="date"
                      className="form-control"
                      value={DateRanges.startDate}
                      onChange={(e) =>
                        setDateRanges({
                          ...DateRanges,
                          startDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className=" mb-4 ">
                  <label className="col-sm-2 col-form-label">สิ้นสุด</label>
                  <div className="col-sm-5">
                    <input
                      type="date"
                      className="form-control"
                      value={DateRanges.endDate}
                      onChange={(e) =>
                        setDateRanges({
                          ...DateRanges,
                          endDate: e.target.value,
                        })
                      }
                    />
                    <span className="text-danger"> </span>
                  </div>
                </div>

                <div className=" mb-4 ">
                  <label className="col-sm-2 col-form-label">
                    ประเภทสินค้า
                  </label>
                  <div className="col-sm-5">
                    <select
                      className=" w-full"
                      value={selectCategory}
                      onChange={(e) => setSelectCategory(e.target.value)}
                    >
                      <option value="ทั้งหมด">ทั้งหมด</option>
                      {categoryProduct &&
                        categoryProduct.map((op) => (
                          <option key={op.type_id} value={op.type_category}>
                            {op.type_category}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className="mb-4 ">
                  <label className="col-sm-2 col-form-label"></label>
                  <div className="col-sm-5">
                    <button className="btn btn-primary"> ค้นหา </button>
                  </div>
                </div>
              </div>
            </form>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>ลำดับ</th>
                    <th>รหัส</th>
                    <th></th>
                    <th>ชื่อสินค้า</th>
                    <th>ยอดขายหน่วย</th>
                    <th>จำนวนที่ขายได้</th>
                    <th>ยอดขายทั้งหมด</th>
                  </tr>
                </thead>
                <tbody>
                  {TopSale &&
                    TopSale.map((list, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{list.product_id}</td>

                        <img
                          src={`http://localhost:3001/img/product/${list.product_img}`}
                          alt={list.product_name}
                          className="w-10 h-10"
                        />

                        <td>{list.product_name}</td>
                        <td>{list.product_price}</td>
                        <td>{list.total_quantity_sold}</td>
                        <td>{list.total_sales_amount}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </figure>
        </div>
        <div className="col-span-3 bg-base-100 shadow-xl p-5 rounded-lg">
          <h2 className="card-title my-2">ค่าคอมมิสชั่น</h2>
          {selectTimeline(fetchCommition)}
          <figure className="h-full mt-3 ">
            <ul>
              {Commition.length > 0 ? (
                Commition.map((item, index) => (
                  <li key={index}>
                    <div className="flex justify-between w-1/2 ">
                      <div className="">
                        {item.employee_id}{" "}
                        {item.employee_fname + " " + item.employee_lname}
                      </div>
                      <div className=""> {item.total_commission} บาท</div>
                    </div>
                  </li>
                ))
              ) : (
                <li>ไม่มีข้อมูล</li>
              )}
            </ul>
          </figure>
        </div>
      </main>
    </>
  );
}

export default Dashboard;
