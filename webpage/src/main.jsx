import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./index.css";
import Login from "./Login.jsx";
import Home from "./components/Home.jsx";
import Register from "./components/Register.jsx";
import Dashboard from "./components/Dashboard.jsx";
import User from "./components/User.jsx";
import Error from "./Error.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import All from "./All.jsx";
import E_dep from "./components/edit/E_dep.jsx";
import I_dep from "./components/insert/I_dep.jsx";
import Department from "./components/Department.jsx";
import Employee from "./components/Employee.jsx";
import I_emp from "./components/insert/I_emp.jsx";
import Edit_emp from "./components/edit/Edit_emp.jsx";
import Position from "./components/Position.jsx";
import E_posit from "./components/edit/E_posit.jsx";
import I_posit from "./components/insert/I_posit.jsx";
import Brand from "./components/Brand.jsx";
import E_brand from "./components/edit/E_brand.jsx";
import I_brand from "./components/insert/I_brand.jsx";
import Type from "./components/Type.jsx";
import I_type from "./components/insert/I_type.jsx";
import E_type from "./components/edit/E_type.jsx";
import Unit from "./components/Unit.jsx";
import I_unit from "./components/insert/I_unit.jsx";
import E_unit from "./components/edit/E_unit.jsx";
import Unit_m from "./components/Unit_m.jsx";
import I_unit_m from "./components/insert/I_unit_m.jsx";
import E_unit_m from "./components/edit/E_unit_m.jsx";
import Expensetype from "./components/Expensetype.jsx";
import I_expensetype from "./components/insert/I_expensetype.jsx";
import E_expensetype from "./components/edit/E_expensetype.jsx";
import Quotation from "./components/Quotation.jsx";
import View_quotation from "./components/views/View_quotation.jsx";
import I_quotation from "./components/insert/I_quotation.jsx";
import E_quotation from "./components/edit/E_quotation.jsx";
import Customer from "./components/customer.jsx";
import I_customer from "./components/insert/I_customer.jsx";
import E_customer from "./components/edit/E_customer.jsx";
import Product from "./components/product.jsx";
import I_product from "./components/insert/I_product.jsx";
import E_product from "./components/edit/E_product.jsx";
import Stock from "./components/stock/Stock.jsx";
import Bank from "./components/Bank.jsx";
import I_bank from "./components/insert/I_bank.jsx";
import E_bank from "./components/edit/E_bank.jsx";
import Bill from "./components/Bill.jsx";
import I_bill from "./components/insert/I_bill.jsx";
import E_bill from "./components/edit/E_bill.jsx";
import Receipt from "./components/Receipt.jsx";
import I_receipt from "./components/insert/I_receipt.jsx";
import Invoice from "./components/Invoice.jsx";
import I_invoice from "./components/insert/I_invoice.jsx";
import E_invoice from "./components/edit/E_invoice.jsx";
import Testimg from "./components/Testimg.jsx";
import View_receipt from "./components/views/View_receipt.jsx";
import View_bill from "./components/views/View_bill.jsx";
import View_invoice from "./components/views/View_invoice.jsx";
import Out from "./components/Out.jsx";
import I_out from "./components/insert/I_out.jsx";
import E_out from "./components/edit/E_out.jsx";
import View_out from "./components/views/View_out.jsx";
import ReceiptCash from "./components/ReceiptCash.jsx";
import I_receiptcash from "./components/insert/I_receiptcash.jsx";
import E_receiptcash from "./components/edit/E_receiptcash.jsx";
import View_receiptcash from "./components/views/View_receiptcash.jsx";
const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
    errorElement: <Error />,
  },
  {
    path: "/test",
    element: <Testimg />,
    errorElement: <Error />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/all",
    element: <All />,
    children: [
      {
        path: "user",
        element: <User />,
      },
      {
        path: "home",
        element: <Home />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "employee",
        element: <Employee />,
      },
      {
        path: "employee/insert",
        element: <I_emp />,
      },
      {
        path: "employee/edit/:id",
        element: <Edit_emp />,
      },
      {
        path: "customer",
        element: <Customer />,
      },
      {
        path: "customer/insert",
        element: <I_customer />,
      },
      {
        path: "customer/edit/:id",
        element: <E_customer />,
      },
      {
        path: "department",
        element: <Department />,
      },
      {
        path: "department/insert",
        element: <I_dep />,
      },
      {
        path: "department/edit/:id",
        element: <E_dep />,
      },
      {
        path: "position",
        element: <Position />,
      },
      {
        path: "position/insert",
        element: <I_posit />,
      },
      {
        path: "position/edit/:id",
        element: <E_posit />,
      },
      {
        path: "brand",
        element: <Brand />,
      },
      {
        path: "brand/insert",
        element: <I_brand />,
      },
      {
        path: "brand/edit/:id",
        element: <E_brand />,
      },
      {
        path: "type",
        element: <Type />,
      },
      {
        path: "type/insert",
        element: <I_type />,
      },
      {
        path: "type/edit/:id",
        element: <E_type />,
      },
      {
        path: "unit",
        element: <Unit />,
      },
      {
        path: "unit/insert",
        element: <I_unit />,
      },
      {
        path: "unit/edit/:id",
        element: <E_unit />,
      },
      {
        path: "unit_m",
        element: <Unit_m />,
      },
      {
        path: "unit_m/insert",
        element: <I_unit_m />,
      },
      {
        path: "unit_m/edit/:id",
        element: <E_unit_m />,
      },
      {
        path: "expensetype",
        element: <Expensetype />,
      },
      {
        path: "expensetype/insert",
        element: <I_expensetype />,
      },
      {
        path: "expensetype/edit/:id",
        element: <E_expensetype />,
      },
      {
        path: "bank",
        element: <Bank />,
      },
      {
        path: "bank/insert",
        element: <I_bank />,
      },
      {
        path: "bank/edit/:id",
        element: <E_bank />,
      },
      {
        path: "product",
        element: <Product />,
      },
      {
        path: "product/insert",
        element: <I_product />,
      },
      {
        path: "product/edit/:id",
        element: <E_product />,
      },
      {
        path: "product/stock/:id",
        element: <Stock />,
      },
      {
        path: "quotation",
        element: <Quotation />,
      },
      {
        path: "quotation/insert",
        element: <I_quotation />,
      },
      {
        path: "quotation/view/:id",
        element: <View_quotation />,
      },
      {
        path: "quotation/edit/:id",
        element: <E_quotation />,
      },
      {
        path: "bill",
        element: <Bill />,
      },
      {
        path: "bill/insert",
        element: <I_bill />,
      },
      {
        path: "bill/view",
        element: <View_bill />,
      },
      {
        path: "bill/edit/:id",
        element: <E_bill />,
      },
      {
        path: "invoice",
        element: <Invoice />,
      },
      {
        path: "invoice/insert",
        element: <I_invoice />,
      },
      {
        path: "invoice/view",
        element: <View_invoice />,
      },
      {
        path: "invoice/edit/:id",
        element: <E_invoice />,
      },
      {
        path: "receipt",
        element: <Receipt />,
      },
      {
        path: "receipt/insert",
        element: <I_receipt />,
      },
      {
        path: "receipt/view",
        element: <View_receipt />,
      },
      {
        path: "out",
        element: <Out />,
      },
      {
        path: "out/insert",
        element: <I_out />,
      },
      {
        path: "out/edit/:id",
        element: <E_out />,
      },
      {
        path: "out/view/:id",
        element: <View_out />,
      },
      {
        path: "receiptcash",
        element: <ReceiptCash />,
      },
      {
        path: "receiptcash/insert",
        element: <I_receiptcash />,
      },
      {
        path: "receiptcash/edit/:id",
        element: <E_receiptcash />,
      },
      {
        path: "receiptcash/view/:id",
        element: <View_receiptcash />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
