import { Inject, Injectable } from '@nestjs/common';
import { billings, earnings, utility_applications } from 'database';
import { endOfMonth, formatDate, startOfMonth, subMonths } from 'date-fns';
import { and, between, or } from 'drizzle-orm';
import { Command } from 'nestjs-command';

import { Database } from '@/modules/database/database.providers';

type Billings = {
  agencyId: number;
  month: string;
  gasCount: number;
  electricCount: number;
  bothCount: number;
  amount: number;
  billingTotal?: number;
  earningTotal?: number;
};

@Injectable()
export class CalculateBillngsCommand {
  constructor(@Inject('DATABASE') private readonly db: Database) {}

  @Command({
    command: 'calculate:billings',
    describe: '',
  })
  async excute() {
    console.time('billings');

    const lastMonth = subMonths(new Date(), 1);
    console.log('tagetMonth', lastMonth);
    const startOfLastMonth = startOfMonth(lastMonth);
    const endOfLastMonth = endOfMonth(lastMonth);

    const utilityApplications =
      await this.db.query.utility_applications.findMany({
        with: {
          application: {
            columns: {
              agencyId: true,
            },
            with: {
              agency: true,
            },
          },
          company: true,
        },
        where: and(
          or(
            between(
              utility_applications.electricStartDate,
              formatDate(startOfLastMonth, 'yyyy-MM-dd'),
              formatDate(endOfLastMonth, 'yyyy-MM-dd'),
            ),
            between(
              utility_applications.gasStartDate,
              formatDate(startOfLastMonth, 'yyyy-MM-dd'),
              formatDate(endOfLastMonth, 'yyyy-MM-dd'),
            ),
          ),
        ),
      });

    const utilityApplicationsWithTarget = utilityApplications
      .map((utilityApplication) => {
        const targetDate =
          utilityApplication.electricStartDate ||
          utilityApplication.gasStartDate;
        return {
          ...utilityApplication,
          targetDate,
        };
      })
      .filter(({ targetDate }) => {
        if (!targetDate) return false;
        return (
          formatDate(targetDate, 'yyyy-MM') ===
          formatDate(startOfLastMonth, 'yyyy-MM')
        );
      });

    const groupedBy: {
      [agencyId: number]: typeof utilityApplicationsWithTarget;
    } = {};
    utilityApplicationsWithTarget.forEach((utilityApplication) => {
      const agencyId = utilityApplication.application.agencyId;
      if (!groupedBy[agencyId]) {
        groupedBy[agencyId] = [];
      }
      groupedBy[agencyId].push(utilityApplication);
    });

    const calculated: { billings: Billings; earnings: Billings }[] =
      Object.entries(groupedBy).map(([agencyId, utilityApplications]) => {
        const summary = {
          agencyId: parseInt(agencyId),
          month: formatDate(startOfLastMonth, 'yyyy-MM'),
          gasCount: 0,
          electricCount: 0,
          bothCount: 0,
          billingTotal: 0,
          earningTotal: 0,
        };

        utilityApplications.forEach((utilityApplication) => {
          const { utilityTypeCode, company } = utilityApplication;

          switch (utilityTypeCode) {
            case 'electric':
              summary.electricCount++;
              summary.billingTotal += company.electricCommissionPay!;
              summary.earningTotal += company.electricCommissionReceive!;
              break;
            case 'gas':
              summary.gasCount++;
              summary.billingTotal += company.gasCommissionPay!;
              summary.earningTotal += company.gasCommissionReceive!;
              break;
            case 'both':
              summary.bothCount++;
              summary.billingTotal += company.bothCommissionPay!;
              summary.earningTotal += company.bothCommissionReceive!;
              break;
          }
        });

        return {
          billings: {
            ...summary,
            amount: summary.billingTotal,
            billingTotal: undefined,
            earningTotal: undefined,
          },
          earnings: {
            ...summary,
            amount: summary.earningTotal,
            billingTotal: undefined,
            earningTotal: undefined,
          },
        };
      });

    if (!calculated.length) {
      console.log('no data');
      return;
    }

    // // TODO error handling
    await this.db.insert(billings).values(
      calculated.map((c) => {
        const { billingTotal, earningTotal, ...rest } = c.billings;
        return rest;
      }),
    );
    await this.db.insert(earnings).values(
      calculated.map((c) => {
        const { billingTotal, earningTotal, ...rest } = c.earnings;
        return rest;
      }),
    );

    console.timeEnd('billings');
  }
}
