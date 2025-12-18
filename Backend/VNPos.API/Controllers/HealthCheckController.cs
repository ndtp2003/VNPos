using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VNPos.Domain.Entities;
using VNPos.Infrastructure.Data;

namespace VNPos.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous]
    public class HealthCheckController : ControllerBase
    {
        private readonly AppDbContext _context;
        public HealthCheckController(AppDbContext context)
        {
            _context = context;
        }
        [HttpGet]
        public async Task<IActionResult> GetHealth()
        {
            try
            {
                var conn = await _context.Database.CanConnectAsync();
                if (!conn)
                {
                    return StatusCode(500, new { Status = "Unhealthy", Error = "Database connection failed." });
                }

                return Ok(new { Status = "Healthy", Timestamp = DateTime.Now, Database = "Connected" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Status = "Unhealthy", Error = ex.Message });
            }
        }

        [HttpGet("Seed Data")]
        public async Task<IActionResult> SeedData()
        {
            try
            {
                var hasDataUser = _context.Users.Any();
                if (!hasDataUser)
                {
                    var adminId = Guid.Parse("11111111-1111-1111-1111-111111111111");
                    var staffId = Guid.Parse("22222222-2222-2222-2222-222222222222");

                    // Seed default users with BCrypt hashed passwords
                    var adminUser = new User
                    {
                        UserId = adminId,
                        FullName = "Administrator",
                        Username = "admin",
                        PasswordHash = "$2a$12$hHllIk.YSLfs/t3fKnvXDeXqBdN.ZEyi1ecZwW6YLBnDj0ik3qR3q", // Password: Admin@123
                        Role = "Admin"
                    };

                    var staffUser = new User
                    {
                        UserId = staffId,
                        FullName = "Staff Member",
                        Username = "staff",
                        PasswordHash = "$2a$12$bih8ZVbkjDlewki73o5CnecyJAMCp5k0mBVaR3gWwbCt1MkGkLs.K", // Password: Staff@123
                        Role = "Staff"
                    };

                    _context.Users.AddRange(adminUser, staffUser);
                }

                var hasDataProduct = _context.Products.Any();
                if (!hasDataProduct)
                {
                    // Seed sample products: 5 fruits x 4 states = 20 products
                    var products = new List<Product>();
                    var fruits = new[] { "Táo", "Chuối", "Đào", "Cam", "Ổi" };
                    var states = new[] { "sống", "chín", "khô", "ép" };

                    var index = 1;
                    foreach (var fruit in fruits)
                    {
                        foreach (var state in states)
                        {
                            products.Add(new Product
                            {
                                Name = $"{fruit} {state}",
                                Price = 10000 * index,
                                QuantityInStock = index * 10 + 5
                            });
                            index++;
                        }
                    }

                    _context.Products.AddRange(products);
                }

                if (!hasDataUser || !hasDataProduct)
                {
                    await _context.SaveChangesAsync();
                }
                return Ok(new { Status = "Data Seeded Successfully", Timestamp = DateTime.Now });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Status = "Unhealthy", Error = ex.Message });
            }
        }

        [HttpGet("Clear Data")]
        public async Task<IActionResult> ClearData()
        {
            try
            {
                _context.OrderDetails.RemoveRange(_context.OrderDetails);
                _context.Orders.RemoveRange(_context.Orders);
                _context.Products.RemoveRange(_context.Products);
                _context.Users.RemoveRange(_context.Users);
                await _context.SaveChangesAsync();
                return Ok(new { Status = "Data Cleared Successfully", Timestamp = DateTime.Now });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Status = "Unhealthy", Error = ex.Message });
            }
        }

    }
}
