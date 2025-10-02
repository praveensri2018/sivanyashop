SET NOCOUNT ON;
GO
USE [SivanyaShop];
GO

-------------------------------------------------
-- USERS
-------------------------------------------------
CREATE TABLE dbo.Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(200) NULL,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(20) NOT NULL,
    ReferralCode NVARCHAR(100) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIMEOFFSET NOT NULL DEFAULT (SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30'))
);
GO

-------------------------------------------------
-- USER PROFILES
-------------------------------------------------
CREATE TABLE dbo.UserProfiles (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL UNIQUE,
    Phone NVARCHAR(20) NULL,
    DateOfBirth DATE NULL,
    Gender NVARCHAR(10) NULL,
    CreatedAt DATETIMEOFFSET NOT NULL DEFAULT (SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')),
    CONSTRAINT FK_UserProfiles_User FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
);
GO

-------------------------------------------------
-- USER ADDRESSES
-------------------------------------------------
CREATE TABLE dbo.UserAddresses (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    AddressLine1 NVARCHAR(255) NOT NULL,
    AddressLine2 NVARCHAR(255) NULL,
    City NVARCHAR(100) NOT NULL,
    State NVARCHAR(100) NOT NULL,
    PostalCode NVARCHAR(20) NOT NULL,
    Country NVARCHAR(100) NOT NULL DEFAULT 'India',
    IsDefault BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIMEOFFSET NOT NULL DEFAULT (SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')),
    CONSTRAINT FK_UserAddresses_User FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
);
GO

-------------------------------------------------
-- USER PAYMENT METHODS
-------------------------------------------------
CREATE TABLE dbo.UserPaymentMethods (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    MethodType NVARCHAR(50) NOT NULL,
    Details NVARCHAR(255) NOT NULL,
    IsDefault BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIMEOFFSET NOT NULL DEFAULT (SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')),
    CONSTRAINT FK_UserPaymentMethods_User FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
);
GO

-------------------------------------------------
-- CUSTOMER REFERRALS
-------------------------------------------------
CREATE TABLE dbo.CustomerReferrals (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CustomerId INT NOT NULL,
    RetailerId INT NOT NULL,
    CreatedAt DATETIMEOFFSET NOT NULL DEFAULT (SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')),
    CONSTRAINT FK_CustomerReferrals_Customer FOREIGN KEY (CustomerId) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_CustomerReferrals_Retailer FOREIGN KEY (RetailerId) REFERENCES dbo.Users(Id),
    CONSTRAINT UX_CustomerReferrals UNIQUE (CustomerId)
);
GO

-------------------------------------------------
-- CATEGORIES
-------------------------------------------------
CREATE TABLE dbo.Categories (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    ParentCategoryId INT NULL,
    CreatedAt DATETIMEOFFSET NOT NULL DEFAULT (SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')),
    CONSTRAINT FK_Categories_Parent FOREIGN KEY (ParentCategoryId) REFERENCES dbo.Categories(Id)
);
GO

-------------------------------------------------
-- PRODUCTS
-------------------------------------------------
CREATE TABLE dbo.Products (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    ImagePath NVARCHAR(500) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    IsFeatured BIT NOT NULL DEFAULT 0,
    CreatedById INT NULL,
    CreatedAt DATETIMEOFFSET NOT NULL DEFAULT (SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')),
    CONSTRAINT FK_Products_CreatedBy FOREIGN KEY (CreatedById) REFERENCES dbo.Users(Id)
);
GO

-------------------------------------------------
-- PRODUCT CATEGORIES
-------------------------------------------------
CREATE TABLE dbo.ProductCategories (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProductId INT NOT NULL,
    CategoryId INT NOT NULL,
    CONSTRAINT FK_ProductCategories_Product FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id),
    CONSTRAINT FK_ProductCategories_Category FOREIGN KEY (CategoryId) REFERENCES dbo.Categories(Id)
);
GO

-------------------------------------------------
-- PRODUCT VARIANTS
-------------------------------------------------
CREATE TABLE dbo.ProductVariants (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProductId INT NOT NULL,
    SKU NVARCHAR(100) NULL,
    VariantName NVARCHAR(255) NULL,
    Attributes NVARCHAR(MAX) NULL,
    StockQty INT NOT NULL DEFAULT 0,
    CreatedAt DATETIMEOFFSET NOT NULL DEFAULT (SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')),
    CONSTRAINT FK_ProductVariants_Product FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id)
);
GO

-------------------------------------------------
-- VARIANT PRICES
-------------------------------------------------
CREATE TABLE dbo.VariantPrices (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    VariantId INT NOT NULL,
    PriceType NVARCHAR(20) NOT NULL CHECK (PriceType IN ('RETAILER','CUSTOMER')),
    Price DECIMAL(18,2) NOT NULL,
    EffectiveFrom DATETIMEOFFSET NULL,
    EffectiveTo DATETIMEOFFSET NULL,
    IsActive BIT NOT NULL DEFAULT (1),
    CreatedAt DATETIMEOFFSET NOT NULL DEFAULT (SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')),
    CONSTRAINT FK_VariantPrices_Variant FOREIGN KEY (VariantId) REFERENCES dbo.ProductVariants(Id)
);
GO

-------------------------------------------------
-- RETAILER VARIANT PRICES
-------------------------------------------------
CREATE TABLE dbo.RetailerVariantPrices (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    RetailerId INT NOT NULL,
    VariantId INT NOT NULL,
    WholesalePrice DECIMAL(18,2) NOT NULL,
    RetailerSellingPrice DECIMAL(18,2) NULL,
    EffectiveFrom DATETIMEOFFSET NULL,
    EffectiveTo DATETIMEOFFSET NULL,
    IsActive BIT NOT NULL DEFAULT (1),
    CreatedAt DATETIMEOFFSET NOT NULL DEFAULT (SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')),
    CONSTRAINT FK_RVP_Retailer FOREIGN KEY (RetailerId) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_RVP_Variant FOREIGN KEY (VariantId) REFERENCES dbo.ProductVariants(Id)
);
GO

-------------------------------------------------
-- CARTS
-------------------------------------------------
CREATE TABLE dbo.Carts (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    CreatedAt DATETIMEOFFSET NOT NULL DEFAULT (SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')),
    UpdatedAt DATETIMEOFFSET NULL,
    CONSTRAINT FK_Carts_User FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
);
GO

CREATE TABLE dbo.CartItems (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CartId INT NOT NULL,
    ProductId INT NOT NULL,
    VariantId INT NOT NULL,
    Qty INT NOT NULL DEFAULT 1,
    Price DECIMAL(18,2) NOT NULL, -- unit price at time added to cart
    CreatedAt DATETIMEOFFSET NOT NULL DEFAULT (SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')),
    CONSTRAINT FK_CartItems_Cart FOREIGN KEY (CartId) REFERENCES dbo.Carts(Id),
    CONSTRAINT FK_CartItems_Product FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id),
    CONSTRAINT FK_CartItems_Variant FOREIGN KEY (VariantId) REFERENCES dbo.ProductVariants(Id)
);
GO

-------------------------------------------------
-- ORDERS
-------------------------------------------------
CREATE TABLE dbo.Orders (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    RetailerId INT NULL,
    ShippingAddressId INT NULL,
    Status NVARCHAR(30) NOT NULL DEFAULT 'PENDING',
    PaymentStatus NVARCHAR(30) NOT NULL DEFAULT 'PENDING',
    TotalAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
    CreatedAt DATETIMEOFFSET NOT NULL DEFAULT (SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')),
    CONSTRAINT FK_Orders_User FOREIGN KEY (UserId) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Orders_Retailer FOREIGN KEY (RetailerId) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Orders_ShippingAddress FOREIGN KEY (ShippingAddressId) REFERENCES dbo.UserAddresses(Id)
);
GO

-------------------------------------------------
-- ORDER ITEMS
-------------------------------------------------
CREATE TABLE dbo.OrderItems (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT NOT NULL,
    ProductId INT NOT NULL,
    VariantId INT NOT NULL,
    Qty INT NOT NULL,
    Price DECIMAL(18,2) NOT NULL,
    CreatedAt DATETIMEOFFSET NOT NULL DEFAULT (SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')),
    CONSTRAINT FK_OrderItems_Order FOREIGN KEY (OrderId) REFERENCES dbo.Orders(Id),
    CONSTRAINT FK_OrderItems_Product FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id),
    CONSTRAINT FK_OrderItems_Variant FOREIGN KEY (VariantId) REFERENCES dbo.ProductVariants(Id)
);
GO

-------------------------------------------------
-- PAYMENTS
-------------------------------------------------
CREATE TABLE dbo.Payments (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    Method NVARCHAR(50) NOT NULL,
    PaymentGateway NVARCHAR(100) NULL,
    TransactionRef NVARCHAR(255) NULL,
    Status NVARCHAR(30) NOT NULL DEFAULT 'PENDING',
    CreatedAt DATETIMEOFFSET NOT NULL DEFAULT (SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')),
    CONSTRAINT FK_Payments_Order FOREIGN KEY (OrderId) REFERENCES dbo.Orders(Id)
);
GO

-------------------------------------------------
-- STOCK LEDGER
-------------------------------------------------
CREATE TABLE dbo.StockLedger (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProductId INT NOT NULL,
    VariantId INT NOT NULL,
    RefOrderId INT NULL,
    RefOrderItemId INT NULL,
    MovementType NVARCHAR(30) NOT NULL,
    Quantity INT NOT NULL,
    CreatedAt DATETIMEOFFSET NOT NULL DEFAULT (SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')),
    CONSTRAINT FK_StockLedger_Product FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id),
    CONSTRAINT FK_StockLedger_Variant FOREIGN KEY (VariantId) REFERENCES dbo.ProductVariants(Id),
    CONSTRAINT FK_StockLedger_Order FOREIGN KEY (RefOrderId) REFERENCES dbo.Orders(Id)
);
GO

-------------------------------------------------
-- FINANCIAL LEDGER
-------------------------------------------------
CREATE TABLE dbo.FinancialLedger (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NULL,
    AccountSegment NVARCHAR(20) NOT NULL,
    RefOrderId INT NULL,
    RefOrderItemId INT NULL,
    RefPaymentId INT NULL,
    LedgerType NVARCHAR(30) NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    Narration NVARCHAR(500) NULL,
    CreatedAt DATETIMEOFFSET NOT NULL DEFAULT (SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')),
    CONSTRAINT FK_FinancialLedger_User FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
);
GO

-------------------------------------------------
-- PAYOUTS (manual retailer settlement support)
-------------------------------------------------
CREATE TABLE dbo.Payouts (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    RetailerId INT NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    FromDate DATETIMEOFFSET NULL,    -- settlement start date for this payout
    ToDate DATETIMEOFFSET NULL,      -- settlement end date for this payout
    Status NVARCHAR(30) NOT NULL DEFAULT 'PENDING',
    Reference NVARCHAR(255) NULL,
    InitiatedBy INT NULL,            -- admin user who created payout
    ProcessedBy INT NULL,            -- admin user who processed payout
    CreatedAt DATETIMEOFFSET NOT NULL DEFAULT (SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')),
    ProcessedAt DATETIMEOFFSET NULL,
    Note NVARCHAR(1000) NULL,
    CONSTRAINT FK_Payouts_Retailer FOREIGN KEY (RetailerId) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Payouts_Initiator FOREIGN KEY (InitiatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Payouts_Processor FOREIGN KEY (ProcessedBy) REFERENCES dbo.Users(Id)
);
GO

-------------------------------------------------
-- SCHEMA MIGRATIONS
-------------------------------------------------
CREATE TABLE dbo.SchemaMigrations (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MigrationName NVARCHAR(200) NOT NULL,
    AppliedAt DATETIMEOFFSET NOT NULL DEFAULT (SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30'))
);
GO


CREATE TABLE dbo.ProductImages (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProductId INT NOT NULL,
    ImageUrl NVARCHAR(500) NOT NULL,
    IsPrimary BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIMEOFFSET NOT NULL DEFAULT (SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')),
    CONSTRAINT FK_ProductImages_Product FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id)
);
GO


CREATE or alter TRIGGER TRG_Users_InsertReferral
ON dbo.Users
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @code NVARCHAR(6);
    DECLARE @id INT;

    -- Cursor through all inserted rows with Role='RETAILER'
    DECLARE cur CURSOR FOR
    SELECT Id FROM inserted WHERE Role='RETAILER';

    OPEN cur;
    FETCH NEXT FROM cur INTO @id;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Generate unique code
        DECLARE @exists INT = 1;
        WHILE @exists = 1
        BEGIN
            -- Generate random 6-character alphanumeric
            SET @code = SUBSTRING(CONVERT(VARCHAR(36), NEWID()), 1, 6);

            -- Check uniqueness
            IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE ReferralCode = @code)
                SET @exists = 0;
        END

        -- Update the inserted user with unique referral code
        UPDATE dbo.Users
        SET ReferralCode = @code
        WHERE Id = @id;

        FETCH NEXT FROM cur INTO @id;
    END

    CLOSE cur;
    DEALLOCATE cur;
END
GO
