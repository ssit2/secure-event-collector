using FluentValidation;
using SecurityEventApi.Models;

namespace SecurityEventApi.Validators;

public class SecurityEventValidator : AbstractValidator<SecurityEvent>
{
    public SecurityEventValidator()
    {
        RuleFor(x => x.EventType)
            .NotEmpty().WithMessage("EventType is required.")
            .Must(type => type == EventTypes.Authentication || type == EventTypes.Firewall || type == EventTypes.Api)
            .WithMessage($"EventType must be one of: {EventTypes.Authentication}, {EventTypes.Firewall}, {EventTypes.Api}.");

        RuleFor(x => x.Severity)
            .IsInEnum().WithMessage("Severity must be a valid enum value.");

        RuleFor(x => x.Source)
            .NotEmpty().WithMessage("Source is required.");

        RuleFor(x => x.Payload)
            .NotNull().WithMessage("Payload is required.");
    }
}
