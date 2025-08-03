'use client'
import React, { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { Line } from 'react-chartjs-2';
import randomColor from 'randomcolor';
import { saveAs } from 'file-saver';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
} from 'chart.js';


ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
);



interface ExpDataType {
  experiment_id: string;
  metric_name: string;
  step: string;
  value: string;
}

const ExperimentApp: React.FC = () => {
  const [data, setData] = useState<ExpDataType[]>([]);
  const [experiments, setExperiments] = useState<string[]>([]);
  const [selectedExperiments, setSelectedExperiments] = useState<string[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [chartLoading, setChartLoading] = useState<boolean>(false);
  const [expSearch, setExpSearch] = useState('');

  // plugin zoom register
  useEffect(() => {
    if (typeof window !== "undefined")
      import("chartjs-plugin-zoom").then((plugin) => {
        ChartJS.register(plugin.default);
      });
  }, []);


  // upload file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    Papa.parse<ExpDataType>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data);
        const uniqueExperiments = [...new Set(results.data.map((d) => d.experiment_id))];
        setExperiments(uniqueExperiments);
        setLoading(false);
      }
    });
  };

  //experiment selection
  const toggleExperiment = (id: string) => {
    setSelectedExperiments((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  //create nested map
  const structuredData = useMemo(() => {
    const map = new Map<string, Map<string, Map<number, number>>>();
    data.forEach((d) => {
      const step = Number(d.step);
      const value = Number(d.value);

      if (!map.has(d.experiment_id)) {
        map.set(d.experiment_id, new Map());
      }

      const metricsMap = map.get(d.experiment_id)!;
      if (!metricsMap.has(d.metric_name)) {
        metricsMap.set(d.metric_name, new Map());
      }
      metricsMap.get(d.metric_name)!.set(step, value);
    });
    return map;
  }, [data]);

  // all metrics
  const allMetrics = useMemo(() => {
    const set = new Set<string>();
    data.forEach((d) => set.add(d.metric_name));
    return Array.from(set);
  }, [data])


  // chart js data
  const chartData = useMemo(() => {
    if (!selectedMetric || selectedExperiments.length === 0) return null;

    setChartLoading(true);

    const stepsSet = new Set<number>();
    selectedExperiments.forEach((exp) => {
      const metricMap = structuredData.get(exp)?.get(selectedMetric);
      if (metricMap) {
        Array.from(metricMap.keys()).forEach((step) => stepsSet.add(step));
      }
    });

    const steps = Array.from(stepsSet).sort((a, b) => a - b);

    // datasets
    const datasets = selectedExperiments.map((exp) => {
      const metricMap = structuredData.get(exp)?.get(selectedMetric);
      const dataPoints = steps.map((step) => metricMap?.get(step) ?? null);

      return {
        label: exp,
        data: dataPoints,
        borderColor: randomColor({ luminosity: 'bright' }),
        backgroundColor: 'transparent',
        spanGaps: true,
        fill: false,
        tension: 0.3,
        pointRadius: 0
      };

    });

    setTimeout(() => setChartLoading(false), 400);

    return {
      labels: steps,
      datasets,
    }

  }, [structuredData, selectedMetric, selectedExperiments]);

  // chart js options
  const options = {
    responsive: true,
    interaction: {
      mode: 'nearest' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: selectedMetric || '',
      },
      zoom: {
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'xy' as 'xy',
        },
        pan: { enabled: true, mode: 'xy' as 'xy' },
      },
    },

    scales: {
      x: {
        title: { display: true, text: 'Step' },
      },
      y: {
        title: { display: true, text: selectedMetric || '' },
      },
    },


  };

  // export chart 
  const handleExportChart = () => {
    const chartCanvas = document.querySelector('canvas') as HTMLCanvasElement;
    chartCanvas.toBlob((blob) => {
      if (blob) saveAs(blob, 'chart.png');
    });
  };


  return (
    <React.Fragment>
      <div className="container my-5">
        <div className="row">
          <div className="col-12 col-xl-6">
            <h2 className='mb-5'>Experiment Dashboard</h2>
            <div className="mb-3">
              <label htmlFor="formFile" className="form-label">Upload CSV file</label>
              <input className="form-control" type="file" id="formFile" accept=".csv" onChange={handleFileUpload} />
              {loading && (
                <div className="d-flex align-items-center mt-4">
                  <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
            </div>
            <div className='d-flex flex-column align-items-start'>
              {experiments.length > 0 && (
                <div className="mb-4">
                  <h4>Experiments</h4>
                  <input type="text" placeholder="Search experiments..." className="form-control mb-2"
                    value={expSearch} onChange={(e) => setExpSearch(e.target.value)} />
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {experiments
                      .filter((id) => id.toLowerCase().includes(expSearch.toLowerCase()))
                      .map((id) => (
                        <div key={id} className="form-check">
                          <input
                            id={`expcheck-${id}`}
                            type="checkbox"
                            checked={selectedExperiments.includes(id)}
                            onChange={() => toggleExperiment(id)}
                            className="form-check-input" />
                          <label className="form-check-label" htmlFor={`expcheck-${id}`}>{id}</label>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {allMetrics.length > 0 && (
                <div className='w-100 mb-5'>
                  <h4 className="mb-3">Metrics</h4>
                  <select value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)} className="form-select">
                    <option value="">-- Select Metric --</option>
                    {allMetrics.map((metric) => (
                      <option key={metric} value={metric}>{metric}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
          <div className="col-12 col-xl-6">
            {!chartLoading && chartData &&
              <div className='w-100 d-flex justify-content-end mt-5 mb-3'>
                <button className="btn btn-outline-primary me-2" onClick={handleExportChart}>Export Chart</button>
              </div>
            }
            {chartLoading ? (
              <div className="w-100 h-100 d-flex justify-content-center align-items-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              chartData && <Line data={chartData} options={options} />
            )}
          </div>
        </div>
      </div>
    </React.Fragment>
  )
}

export default ExperimentApp
