const sizeChartRepo = require('../repositories/sizeChartRepo');

class SizeChartService {
    
    // Create new size chart
    async createSizeChart({ name, chartType, description, measurements }) {
        // Validate required fields
        if (!name || !chartType) {
            throw { status: 400, message: 'Name and chartType are required' };
        }

        // Validate chart type
        const validChartTypes = ['DRESS', 'SHOES', 'GENERAL'];
        if (!validChartTypes.includes(chartType)) {
            throw { status: 400, message: 'Invalid chart type. Must be DRESS, SHOES, or GENERAL' };
        }

        // Validate measurements structure
        if (!Array.isArray(measurements)) {
            throw { status: 400, message: 'Measurements must be an array' };
        }

        // Validate each measurement object
        for (const measurement of measurements) {
            if (!measurement.size || typeof measurement.size !== 'string') {
                throw { status: 400, message: 'Each measurement must have a size string' };
            }
            if (!measurement.measurements || typeof measurement.measurements !== 'object') {
                throw { status: 400, message: 'Each measurement must have a measurements object' };
            }
        }

        return await sizeChartRepo.createSizeChart({
            name,
            chartType,
            description,
            measurements
        });
    }

    // Get all size charts
    async getSizeCharts({ page = 1, limit = 20, chartType = null }) {
        const offset = (page - 1) * limit;
        
        return await sizeChartRepo.getSizeCharts({
            offset,
            limit,
            chartType
        });
    }

    // Get size chart by ID
    async getSizeChartById(id) {
        if (!id) {
            throw { status: 400, message: 'Size chart ID is required' };
        }

        const sizeChart = await sizeChartRepo.getSizeChartById(id);
        if (!sizeChart) {
            throw { status: 404, message: 'Size chart not found' };
        }

        return sizeChart;
    }

    // Update size chart
    async updateSizeChart(id, updateData) {
        if (!id) {
            throw { status: 400, message: 'Size chart ID is required' };
        }

        // Check if size chart exists
        const exists = await sizeChartRepo.sizeChartExists(id);
        if (!exists) {
            throw { status: 404, message: 'Size chart not found' };
        }

        // Validate chart type if provided
        if (updateData.chartType) {
            const validChartTypes = ['DRESS', 'SHOES', 'GENERAL'];
            if (!validChartTypes.includes(updateData.chartType)) {
                throw { status: 400, message: 'Invalid chart type. Must be DRESS, SHOES, or GENERAL' };
            }
        }

        // Validate measurements if provided
        if (updateData.measurements && !Array.isArray(updateData.measurements)) {
            throw { status: 400, message: 'Measurements must be an array' };
        }

        return await sizeChartRepo.updateSizeChart(id, updateData);
    }

    // Delete size chart
    async deleteSizeChart(id) {
        if (!id) {
            throw { status: 400, message: 'Size chart ID is required' };
        }

        // Check if size chart exists
        const exists = await sizeChartRepo.sizeChartExists(id);
        if (!exists) {
            throw { status: 404, message: 'Size chart not found' };
        }

        return await sizeChartRepo.deleteSizeChart(id);
    }

    // Assign size chart to product
    async assignSizeChartToProduct(productId, sizeChartId, isPrimary = false) {
        if (!productId || !sizeChartId) {
            throw { status: 400, message: 'Product ID and Size Chart ID are required' };
        }

        // Check if product exists
        const productExists = await sizeChartRepo.productExists(productId);
        if (!productExists) {
            throw { status: 404, message: 'Product not found' };
        }

        // Check if size chart exists
        const sizeChartExists = await sizeChartRepo.sizeChartExists(sizeChartId);
        if (!sizeChartExists) {
            throw { status: 404, message: 'Size chart not found' };
        }

        return await sizeChartRepo.assignSizeChartToProduct(productId, sizeChartId, isPrimary);
    }

    // Remove size chart from product
    async removeSizeChartFromProduct(productId, sizeChartId) {
        if (!productId || !sizeChartId) {
            throw { status: 400, message: 'Product ID and Size Chart ID are required' };
        }

        return await sizeChartRepo.removeSizeChartFromProduct(productId, sizeChartId);
    }

    // Get all size charts for a product
    async getProductSizeCharts(productId) {
        if (!productId) {
            throw { status: 400, message: 'Product ID is required' };
        }

        // Check if product exists
        const productExists = await sizeChartRepo.productExists(productId);
        if (!productExists) {
            throw { status: 404, message: 'Product not found' };
        }

        return await sizeChartRepo.getProductSizeCharts(productId);
    }

    // Get primary size chart for a product
    async getPrimarySizeChart(productId) {
        if (!productId) {
            throw { status: 400, message: 'Product ID is required' };
        }

        return await sizeChartRepo.getPrimarySizeChart(productId);
    }

    // Set primary size chart for a product
    async setPrimarySizeChart(productId, sizeChartId) {
        if (!productId || !sizeChartId) {
            throw { status: 400, message: 'Product ID and Size Chart ID are required' };
        }

        // Check if association exists
        const productCharts = await sizeChartRepo.getProductSizeCharts(productId);
        const associationExists = productCharts.some(chart => chart.id === sizeChartId);
        
        if (!associationExists) {
            throw { status: 400, message: 'Size chart is not associated with this product' };
        }

        // Clear existing primary and set new primary
        await sizeChartRepo.clearPrimarySizeChart(productId);
        return await sizeChartRepo.assignSizeChartToProduct(productId, sizeChartId, true);
    }
}

module.exports = new SizeChartService();