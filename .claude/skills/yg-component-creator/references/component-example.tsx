// Real example from: apps/tenant-ksa/src/app/components/offerStatusHistoryLayout/index.tsx
// Pattern: memo + displayName, render functions, callback props, useTranslation
import TanstackDataTable from '@fd-admin-portal/ui-components/dataGrid/tanstackTable';
import Select from '@fd-admin-portal/ui-components/select';
import { memo } from 'react';

type OfferStatusHistoryLayoutProps = {
  isLoading: boolean;
  data: OfferStatusHistoryResponse | undefined;
  offers: ProspectOffer[];
  selectedOfferId: number | null;
  page: number;
  size: number;
  onPageChange: (page: number, size: number) => void;
  onOfferChange: (offerId: number | null) => void;
};

const OfferStatusHistoryLayout = memo(
  ({
    isLoading,
    data,
    offers,
    selectedOfferId,
    page,
    size,
    onPageChange,
    onOfferChange,
  }: OfferStatusHistoryLayoutProps) => {
    const {
      t,
      tableColumns,
      formattedData,
      handleTablePage,
      handleOfferChange,
      offerSelectValues,
    } = useOfferStatusHistory({ data, offers, onPageChange, onOfferChange });

    const renderOfferFilter = () => {
      if (offers.length <= 1) {
        return null;
      }
      return (
        <div className="mb-4 max-w-[280px]">
          <Select
            placeholder={t(
              'prospectDetails.offerStatusHistory.filter.allOffers',
            )}
            selectValues={offerSelectValues}
            size="small"
            value={selectedOfferId !== null ? String(selectedOfferId) : ''}
            onChange={handleOfferChange}
          />
        </div>
      );
    };

    return (
      <DetailsCard title={t('prospectDetails.offerStatusHistory.title')}>
        {renderOfferFilter()}
        <TanstackDataTable
          columns={tableColumns}
          data={formattedData}
          isTableLoading={isLoading}
          totalRecords={data?.totalRecords ?? 0}
          onPage={handleTablePage}
        />
      </DetailsCard>
    );
  },
);

OfferStatusHistoryLayout.displayName = 'OfferStatusHistoryLayout';
export default OfferStatusHistoryLayout;
