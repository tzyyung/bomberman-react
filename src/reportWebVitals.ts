/**
 * Web Vitals 性能監控工具 (reportWebVitals.ts)
 * 
 * 功能說明：
 * - 監控網頁性能指標（Core Web Vitals）
 * - 測量用戶體驗相關的性能數據
 * - 提供性能分析和優化建議
 * - 支持動態導入以減少初始包大小
 * 
 * 監控指標：
 * - CLS (Cumulative Layout Shift): 累積佈局偏移
 * - FID (First Input Delay): 首次輸入延遲
 * - FCP (First Contentful Paint): 首次內容繪製
 * - LCP (Largest Contentful Paint): 最大內容繪製
 * - TTFB (Time to First Byte): 首字節時間
 */

import { ReportHandler } from 'web-vitals'; // Web Vitals 報告處理器類型

/**
 * 報告 Web Vitals 性能指標
 * 
 * 功能說明：
 * - 動態導入 web-vitals 庫以減少初始包大小
 * - 測量所有核心性能指標
 * - 將結果傳遞給提供的回調函數
 * - 支持可選的性能監控
 * 
 * @param onPerfEntry 可選的性能報告處理函數
 */
const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  // 檢查是否提供了有效的回調函數
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // 動態導入 web-vitals 庫
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // 測量累積佈局偏移（頁面穩定性指標）
      getCLS(onPerfEntry);
      // 測量首次輸入延遲（交互性指標）
      getFID(onPerfEntry);
      // 測量首次內容繪製（載入速度指標）
      getFCP(onPerfEntry);
      // 測量最大內容繪製（載入速度指標）
      getLCP(onPerfEntry);
      // 測量首字節時間（服務器響應指標）
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
