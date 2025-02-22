import React from "react";
import ListTable from "./ListTable";
import PieChartComponent from "./PieChart";

const ViewComponent = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
      <ListTable />
      <PieChartComponent />
    </div>
  );
};

export default ViewComponent;
