import React from "react";
import { Link } from "react-router-dom";

export default function Table({ data, headers, onDelete }) {
  return (
    <div className="overflow-x-auto hidden md:block">
      <table className="w-full table-auto">
        <thead className="bg-base-300 text-left">
          <tr>
            {headers.map((header, index) =>
              index > 2 ? (
                <th
                  key={index}
                  className="hidden xl:px-4 xl:table-cell xl:py-3"
                >
                  {header}
                </th>
              ) : (
                <th key={index} className="px-4 py-3">
                  {header}
                </th>
              )
            )}
            <th className="px-4 py-3">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {data && data.length !== 0 ? (
            data.map((item, index) => {
              const rowData = Object.values(item);
              return (
                <tr key={index} className="border-b">
                  {rowData.map((td, tdIndex) =>
                    tdIndex > 2 ? (
                      <td
                        key={index + tdIndex}
                        className="hidden xl:px-4 xl:table-cell xl:py-3"
                      >
                        {td}
                      </td>
                    ) : (
                      <td key={index + tdIndex} className="px-4 py-3">
                        {td}
                      </td>
                    )
                  )}
                  <td className="px-4 py-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link
                        to={`edit/${rowData[0]}`}
                        className="btn btn-warning text-warning-content btn-sm  opacity-80"
                      >
                        แก้ไข
                      </Link>
                      <button
                        className="btn btn-error btn-sm text-error-content opacity-80"
                        onClick={() => onDelete(rowData[0])}
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={headers.length + 1}
                className="text-center px-4 py-3"
              >
                ไม่มีข้อมูล
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
