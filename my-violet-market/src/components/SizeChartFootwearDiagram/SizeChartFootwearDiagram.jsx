import React from 'react';
import { SIZE_CHART_DEFAULT_GUIDE_SRC } from '../../constants/sizeChartKind';
import SizeChartPhotoDiagram from '../SizeChartPhotoDiagram';

export default function SizeChartFootwearDiagram({ columns, rows, lang, imageSrc }) {
  return (
    <SizeChartPhotoDiagram
      imageSrc={imageSrc || SIZE_CHART_DEFAULT_GUIDE_SRC.footwear}
      columns={columns}
      rows={rows}
      lang={lang}
      variant="footwear"
      titleI18nKey="productDetail.sizeChartKind.footwear"
    />
  );
}
