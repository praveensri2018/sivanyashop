const { query, sql } = require('../lib/db');
const { SizeChart, ProductSizeChart } = require('../models/sizeChart.model');

class SizeChartRepository {
    
    // Create new size chart
    async createSizeChart({ name, chartType, description, measurements }) {
        const result = await query(
            `INSERT INTO SizeCharts (Name, ChartType, Description, Measurements) 
             OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.ChartType, INSERTED.Description, 
                    INSERTED.Measurements, INSERTED.CreatedAt, INSERTED.UpdatedAt
             VALUES (@name, @chartType, @description, @measurements)`,
            {
                name: { type: sql.NVarChar, value: name },
                chartType: { type: sql.NVarChar, value: chartType },
                description: { type: sql.NVarChar, value: description },
                measurements: { type: sql.NVarChar, value: JSON.stringify(measurements) }
            }
        );
        
        return SizeChart.fromDbRow(result.recordset[0]);
    }

    // Get all size charts with pagination
    async getSizeCharts({ offset = 0, limit = 20, chartType = null }) {
        let whereClause = '';
        const params = {
            offset: { type: sql.Int, value: offset },
            limit: { type: sql.Int, value: limit }
        };

        if (chartType) {
            whereClause = 'WHERE ChartType = @chartType';
            params.chartType = { type: sql.NVarChar, value: chartType };
        }

        const result = await query(
            `SELECT *, COUNT(*) OVER() as TotalCount 
             FROM SizeCharts 
             ${whereClause}
             ORDER BY CreatedAt DESC
             OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
            params
        );

        const total = result.recordset[0]?.TotalCount || 0;
        const sizeCharts = result.recordset.map(row => SizeChart.fromDbRow(row));

        return {
            sizeCharts,
            total,
            page: Math.floor(offset / limit) + 1,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    // Get size chart by ID
    async getSizeChartById(id) {
        const result = await query(
            'SELECT * FROM SizeCharts WHERE Id = @id',
            { id: { type: sql.Int, value: id } }
        );

        return result.recordset[0] ? SizeChart.fromDbRow(result.recordset[0]) : null;
    }

    // Update size chart
    async updateSizeChart(id, { name, chartType, description, measurements }) {
        const result = await query(
            `UPDATE SizeCharts 
             SET Name = @name, ChartType = @chartType, Description = @description, 
                 Measurements = @measurements, UpdatedAt = SYSDATETIMEOFFSET() AT TIME ZONE 'India Standard Time'
             OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.ChartType, INSERTED.Description, 
                    INSERTED.Measurements, INSERTED.CreatedAt, INSERTED.UpdatedAt
             WHERE Id = @id`,
            {
                id: { type: sql.Int, value: id },
                name: { type: sql.NVarChar, value: name },
                chartType: { type: sql.NVarChar, value: chartType },
                description: { type: sql.NVarChar, value: description },
                measurements: { type: sql.NVarChar, value: JSON.stringify(measurements) }
            }
        );

        return result.recordset[0] ? SizeChart.fromDbRow(result.recordset[0]) : null;
    }

    // Delete size chart
    async deleteSizeChart(id) {
        // First delete associations
        await query(
            'DELETE FROM ProductSizeCharts WHERE SizeChartId = @id',
            { id: { type: sql.Int, value: id } }
        );

        // Then delete size chart
        const result = await query(
            'DELETE FROM SizeCharts WHERE Id = @id',
            { id: { type: sql.Int, value: id } }
        );

        return result.rowsAffected[0] > 0;
    }

    // Assign size chart to product
    async assignSizeChartToProduct(productId, sizeChartId, isPrimary = false) {
        // If setting as primary, clear existing primary
        if (isPrimary) {
            await query(
                'UPDATE ProductSizeCharts SET IsPrimary = 0 WHERE ProductId = @productId',
                { productId: { type: sql.Int, value: productId } }
            );
        }

        const result = await query(
            `INSERT INTO ProductSizeCharts (ProductId, SizeChartId, IsPrimary) 
             OUTPUT INSERTED.ProductId, INSERTED.SizeChartId, INSERTED.IsPrimary, INSERTED.CreatedAt
             VALUES (@productId, @sizeChartId, @isPrimary)`,
            {
                productId: { type: sql.Int, value: productId },
                sizeChartId: { type: sql.Int, value: sizeChartId },
                isPrimary: { type: sql.Bit, value: isPrimary }
            }
        );

        return result.recordset[0] ? ProductSizeChart.fromDbRow(result.recordset[0]) : null;
    }

    // Remove size chart from product
    async removeSizeChartFromProduct(productId, sizeChartId) {
        const result = await query(
            'DELETE FROM ProductSizeCharts WHERE ProductId = @productId AND SizeChartId = @sizeChartId',
            {
                productId: { type: sql.Int, value: productId },
                sizeChartId: { type: sql.Int, value: sizeChartId }
            }
        );

        return result.rowsAffected[0] > 0;
    }

    // Get all size charts for a product
    async getProductSizeCharts(productId) {
        const result = await query(
            `SELECT sc.*, psc.IsPrimary
             FROM SizeCharts sc
             INNER JOIN ProductSizeCharts psc ON sc.Id = psc.SizeChartId
             WHERE psc.ProductId = @productId
             ORDER BY psc.IsPrimary DESC, sc.CreatedAt DESC`,
            { productId: { type: sql.Int, value: productId } }
        );

        return result.recordset.map(row => {
            const sizeChart = SizeChart.fromDbRow(row);
            sizeChart.isPrimary = row.IsPrimary;
            return sizeChart;
        });
    }

    // Get primary size chart for a product
    async getPrimarySizeChart(productId) {
        const result = await query(
            `SELECT sc.*, psc.IsPrimary
             FROM SizeCharts sc
             INNER JOIN ProductSizeCharts psc ON sc.Id = psc.SizeChartId
             WHERE psc.ProductId = @productId AND psc.IsPrimary = 1`,
            { productId: { type: sql.Int, value: productId } }
        );

        return result.recordset[0] ? SizeChart.fromDbRow(result.recordset[0]) : null;
    }

    // Clear primary size chart for a product
    async clearPrimarySizeChart(productId) {
        await query(
            'UPDATE ProductSizeCharts SET IsPrimary = 0 WHERE ProductId = @productId',
            { productId: { type: sql.Int, value: productId } }
        );
    }

    // Check if size chart exists
    async sizeChartExists(id) {
        const result = await query(
            'SELECT 1 FROM SizeCharts WHERE Id = @id',
            { id: { type: sql.Int, value: id } }
        );

        return result.recordset.length > 0;
    }

    // Check if product exists
    async productExists(id) {
        const result = await query(
            'SELECT 1 FROM Products WHERE Id = @id',
            { id: { type: sql.Int, value: id } }
        );

        return result.recordset.length > 0;
    }
}

module.exports = new SizeChartRepository();