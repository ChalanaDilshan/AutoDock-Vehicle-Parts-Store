import { Request, Response, NextFunction } from 'express';
import { reportingService } from '../services/reporting.service.js';
import { DashboardQuerySchema, ReportQuerySchema } from '../validators/report.validator.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export class ReportingController {
  public async getDashboardSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = DashboardQuerySchema.parse(req.query);
      const summary = await reportingService.getDashboardSummary(query.refresh);

      sendSuccess({
        res,
        code: 'DASHBOARD_SUMMARY_RETRIEVED',
        message: 'Executive platform overview KPIs retrieved successfully',
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportType } = req.params;
      const query = ReportQuerySchema.parse(req.query);

      const result = await reportingService.generateReport(reportType, {
        startDate: query.startDate,
        endDate: query.endDate,
        sellerId: query.sellerId,
        adminUserId: req.user?.userId,
        format: query.format,
      });

      if (query.format === 'csv' && result.csv) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="autodock-${reportType}.csv"`);
        res.status(200).send(result.csv);
        return;
      }

      sendSuccess({
        res,
        code: 'REPORT_RETRIEVED',
        message: `${result.reportName} retrieved successfully`,
        data: result.data,
        meta: {
          reportType,
          recordCount: result.data.length,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const reportingController = new ReportingController();
