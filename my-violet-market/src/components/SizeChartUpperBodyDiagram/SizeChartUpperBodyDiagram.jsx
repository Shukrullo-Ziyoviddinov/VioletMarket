import React from 'react';
import { SIZE_CHART_DEFAULT_GUIDE_SRC } from '../../constants/sizeChartKind';
import SizeChartPhotoDiagram from '../SizeChartPhotoDiagram';

export default function SizeChartUpperBodyDiagram({ columns, rows, lang, imageSrc }) {
  return (
    <SizeChartPhotoDiagram
      imageSrc={imageSrc || SIZE_CHART_DEFAULT_GUIDE_SRC.upper_body}
      columns={columns}
      rows={rows}
      lang={lang}
      variant="upper_body"
      titleI18nKey="productDetail.sizeChartKind.upper_body"
    />
  );
}
