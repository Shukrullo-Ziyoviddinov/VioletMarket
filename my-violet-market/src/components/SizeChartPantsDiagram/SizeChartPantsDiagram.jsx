import React from 'react';
import { SIZE_CHART_DEFAULT_GUIDE_SRC } from '../../constants/sizeChartKind';
import SizeChartPhotoDiagram from '../SizeChartPhotoDiagram';

export default function SizeChartPantsDiagram({ columns, rows, lang, imageSrc }) {
  return (
    <SizeChartPhotoDiagram
      imageSrc={imageSrc || SIZE_CHART_DEFAULT_GUIDE_SRC.pants}
      columns={columns}
      rows={rows}
      lang={lang}
      variant="pants"
      titleI18nKey="productDetail.sizeChartKind.pants"
    />
  );
}
