using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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
    }
}
